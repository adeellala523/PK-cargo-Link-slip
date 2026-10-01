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

function readAllUsers() {
    $filename = 'users.json';
    $candidatePaths = [
        __DIR__ . '/../data/' . $filename,
        __DIR__ . '/../../data/' . $filename,
        __DIR__ . '/data/' . $filename,
        __DIR__ . '/' . $filename,
    ];

    foreach ($candidatePaths as $file) {
        if (file_exists($file)) {
            $content = @file_get_contents($file);
            if ($content) {
                $parsed = json_decode($content, true);
                if (is_array($parsed)) {
                    return $parsed;
                }
            }
        }
    }
    return [];
}

function writeAllUsers($users) {
    $targetFile = getWritableFile('users.json');
    $json = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = @file_put_contents($targetFile, $json, LOCK_EX);
    
    // Also backup to secondary location if possible
    $backupFile = __DIR__ . '/users.json';
    if ($targetFile !== $backupFile) {
        @file_put_contents($backupFile, $json, LOCK_EX);
    }
    
    return $result !== false;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $users = readAllUsers();
    echo json_encode($users, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);

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
                    $userMap[$key] = $u;
                }
            }
        } else if (isset($body['phone'])) {
            // Single user object posted
            $key = preg_replace('/[^0-9]/', '', $body['phone']);
            $userMap[$key] = $body;
        }

        $allUsers = array_values($userMap);
        $saved = writeAllUsers($allUsers);

        echo json_encode([
            'success' => $saved,
            'count' => count($allUsers),
            'users' => $allUsers
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
