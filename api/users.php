<?php
// PK Cargo Link - Robust Users Persistent Storage API for Hostinger
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getWritableFile($filename) {
    $candidateDirs = [
        __DIR__ . '/../data',
        __DIR__ . '/../../data',
        __DIR__ . '/data',
        __DIR__,
    ];

    foreach ($candidateDirs as $dir) {
        if (!file_exists($dir)) {
            @mkdir($dir, 0777, true);
        }
        if (is_dir($dir) && is_writable($dir)) {
            return $dir . '/' . $filename;
        }
    }
    return __DIR__ . '/' . $filename;
}

function saveBase64Image($dataUrl, $prefix = 'user') {
    if (strpos($dataUrl, 'data:image/') !== 0) return $dataUrl;
    $uploadDir = __DIR__ . '/../uploads';
    if (!file_exists($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }
    if (is_dir($uploadDir) && is_writable($uploadDir)) {
        preg_match('/^data:image\/(\w+);base64,/', $dataUrl, $type);
        $ext = isset($type[1]) ? strtolower($type[1]) : 'png';
        if ($ext === 'jpeg') $ext = 'jpg';
        $base64 = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $decoded = base64_decode($base64);
        if ($decoded !== false) {
            $filename = $prefix . '_' . md5($dataUrl) . '.' . $ext;
            @file_put_contents($uploadDir . '/' . $filename, $decoded);
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https://' : 'https://';
            $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'pkcargolink.com';
            return $protocol . $host . '/uploads/' . $filename;
        }
    }
    return $dataUrl;
}

function readAllUsers() {
    $filename = 'users.json';
    $candidatePaths = [
        __DIR__ . '/../data/' . $filename,
        __DIR__ . '/../../data/' . $filename,
        __DIR__ . '/data/' . $filename,
        __DIR__ . '/' . $filename,
    ];

    $merged = [];
    $newestTime = 0;

    foreach ($candidatePaths as $file) {
        if (file_exists($file)) {
            $mtime = @filemtime($file) ?: 0;
            $content = @file_get_contents($file);
            if ($content) {
                $parsed = json_decode($content, true);
                if (is_array($parsed)) {
                    foreach ($parsed as $u) {
                        if (isset($u['phone'])) {
                            $k = preg_replace('/[^0-9]/', '', $u['phone']);
                            if (!isset($merged[$k]) || $mtime >= $newestTime) {
                                $merged[$k] = $u;
                            }
                        }
                    }
                    if ($mtime > $newestTime) {
                        $newestTime = $mtime;
                    }
                }
            }
        }
    }
    return array_values($merged);
}

function writeAllUsers($users) {
    $filename = 'users.json';
    $candidateDirs = [
        __DIR__ . '/../data',
        __DIR__ . '/../../data',
        __DIR__ . '/data',
        __DIR__,
    ];
    
    $json = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $written = false;

    foreach ($candidateDirs as $dir) {
        if (!file_exists($dir)) {
            @mkdir($dir, 0777, true);
        }
        $target = $dir . '/' . $filename;
        $res = @file_put_contents($target, $json, LOCK_EX);
        if ($res !== false) {
            $written = true;
        }
    }
    return $written;
}

// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------

// Remove credential fields before any user record leaves the server.
function sanitizeUser($u) {
    if (!is_array($u)) return $u;
    unset($u['password']);
    unset($u['password_hash']);
    return $u;
}

// Hash a plaintext password before storing. Already-hashed values pass through.
function securePasswordField(&$u) {
    if (!isset($u['password']) || $u['password'] === '' || $u['password'] === null) return;
    $pw = (string)$u['password'];
    if (strpos($pw, '$2y$') === 0 || strpos($pw, '$2a$') === 0 || strpos($pw, '$argon2') === 0) return;
    $hash = password_hash($pw, PASSWORD_DEFAULT);
    if ($hash !== false) {
        $u['password'] = $hash;
    }
}

// Verify a login attempt against the stored credential.
// Supports: no password set (legacy chatbot accounts), modern hashes,
// and legacy plaintext (upgraded to a hash on successful login).
function verifyUserPassword($storedUser, $attempt) {
    $stored = isset($storedUser['password']) ? (string)$storedUser['password'] : '';
    $attempt = (string)$attempt;
    if ($stored === '' || $stored === null) {
        return $attempt !== '' ? 'ok_nopassword' : 'fail';
    }
    if (strpos($stored, '$2y$') === 0 || strpos($stored, '$2a$') === 0 || strpos($stored, '$argon2') === 0) {
        return password_verify($attempt, $stored) ? 'ok' : 'fail';
    }
    if ($stored === $attempt) return 'ok_upgrade'; // legacy plaintext -> re-hash
    return 'fail';
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $users = readAllUsers();
    $safe = array_map('sanitizeUser', $users);
    echo json_encode(array_values($safe), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);

    // --- Secure login endpoint: verifies credentials server-side ---
    if (is_array($body) && isset($body['action']) && $body['action'] === 'login') {
        $phone = isset($body['phone']) ? preg_replace('/[^0-9]/', '', (string)$body['phone']) : '';
        $attempt = isset($body['password']) ? (string)$body['password'] : '';
        $found = null;
        foreach (readAllUsers() as $u) {
            if (isset($u['phone']) && preg_replace('/[^0-9]/', '', (string)$u['phone']) === $phone && $phone !== '') {
                $found = $u;
                break;
            }
        }
        if ($found === null) {
            http_response_code(401);
            echo json_encode(['error' => 'not_found']);
            exit;
        }
        $verdict = verifyUserPassword($found, $attempt);
        if ($verdict === 'fail') {
            http_response_code(401);
            echo json_encode(['error' => 'bad_credentials']);
            exit;
        }
        // Upgrade legacy plaintext passwords to a hash on successful login
        if ($verdict === 'ok_upgrade') {
            $all = readAllUsers();
            foreach ($all as &$u) {
                if (isset($u['phone']) && preg_replace('/[^0-9]/', '', (string)$u['phone']) === $phone) {
                    securePasswordField($u);
                }
            }
            unset($u);
            writeAllUsers($all);
        }
        echo json_encode(sanitizeUser($found), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (is_array($body)) {
        // If an array of users was posted
        $existing = readAllUsers();
        
        // Merge or replace
        $userMap = [];
        foreach ($existing as $u) {
            if (isset($u['phone'])) {
                $key = preg_replace('/[^0-9]/', '', $u['phone']);
                $userMap[$key] = $u;
            }
        }

        // If body is an array of users:
        if (isset($body[0]) || empty($body)) {
            foreach ($body as $u) {
                if (isset($u['phone'])) {
                    $key = preg_replace('/[^0-9]/', '', $u['phone']);
                    // Never wipe a stored credential: if the incoming record
                    // carries no password (e.g. synced from a sanitized GET),
                    // keep the one already stored.
                    if ((!isset($u['password']) || $u['password'] === '' || $u['password'] === null) && isset($userMap[$key]['password'])) {
                        $u['password'] = $userMap[$key]['password'];
                    }
                    securePasswordField($u);
                    // Convert base64 logoUrl to real image
                    if (isset($u['logoUrl']) && strpos($u['logoUrl'], 'data:image/') === 0) {
                        $u['logoUrl'] = saveBase64Image($u['logoUrl'], 'user_' . $key);
                    }
                    $userMap[$key] = $u;
                }
            }
        } else if (isset($body['phone'])) {
            // Single user object posted
            $key = preg_replace('/[^0-9]/', '', $body['phone']);
            if ((!isset($body['password']) || $body['password'] === '' || $body['password'] === null) && isset($userMap[$key]['password'])) {
                $body['password'] = $userMap[$key]['password'];
            }
            securePasswordField($body);
            if (isset($body['logoUrl']) && strpos($body['logoUrl'], 'data:image/') === 0) {
                $body['logoUrl'] = saveBase64Image($body['logoUrl'], 'user_' . $key);
            }
            $userMap[$key] = $body;
        }

        $allUsers = array_values($userMap);
        $saved = writeAllUsers($allUsers);

        echo json_encode([
            'success' => $saved,
            'count' => count($allUsers),
            'users' => array_map('sanitizeUser', $allUsers)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Invalid data format']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
