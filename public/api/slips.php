<?php
// PK Cargo Link - Slips Persistent Storage API for Hostinger
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getAllPossibleSlipsPaths() {
    return [
        __DIR__ . '/slips.json',
        __DIR__ . '/../data/slips.json',
        __DIR__ . '/../../data/slips.json',
        __DIR__ . '/data/slips.json',
    ];
}

function readAllSlips() {
    $paths = getAllPossibleSlipsPaths();
    $bestFile = null;
    $bestMtime = 0;

    foreach ($paths as $file) {
        if (file_exists($file)) {
            $mtime = filemtime($file);
            if ($mtime >= $bestMtime) {
                $bestMtime = $mtime;
                $bestFile = $file;
            }
        }
    }

    if ($bestFile && file_exists($bestFile)) {
        $content = @file_get_contents($bestFile);
        if ($content) {
            $parsed = json_decode($content, true);
            if (is_array($parsed)) {
                return $parsed;
            }
        }
    }
    return [];
}

function writeAllSlips($slips) {
    $json = json_encode($slips, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $paths = getAllPossibleSlipsPaths();
    $written = false;

    foreach ($paths as $file) {
        $dir = dirname($file);
        if (!file_exists($dir)) {
            @mkdir($dir, 0777, true);
        }
        $res = @file_put_contents($file, $json, LOCK_EX);
        if ($res !== false) {
            $written = true;
        }
    }
    return $written;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode(readAllSlips(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    if (empty($id) && isset($_SERVER['REQUEST_URI'])) {
        $parts = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'));
        $lastPart = end($parts);
        if ($lastPart !== 'slips' && $lastPart !== 'slips.php') {
            $id = $lastPart;
        }
    }

    if (empty($id)) {
        $input = file_get_contents('php://input');
        if ($input) {
            $body = json_decode($input, true);
            if (isset($body['id'])) $id = trim($body['id']);
        }
    }

    if (!empty($id)) {
        $slips = readAllSlips();
        $cleanTargetId = preg_replace('/[^a-zA-Z0-9]/', '', strtolower($id));
        $filtered = array_values(array_filter($slips, function($s) use ($id, $cleanTargetId) {
            if (!isset($s['id'])) return true;
            $sClean = preg_replace('/[^a-zA-Z0-9]/', '', strtolower($s['id']));
            return strtolower($s['id']) !== strtolower($id) && $sClean !== $cleanTargetId;
        }));

        writeAllSlips($filtered);

        // Also remove individual dedicated slip file
        $cleanId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $id);
        $singleDirs = [
            __DIR__ . '/../data/slips',
            __DIR__ . '/data/slips',
            __DIR__ . '/slips',
            __DIR__ . '/../slips',
        ];
        foreach ($singleDirs as $sDir) {
            $f = $sDir . '/' . $cleanId . '.json';
            if (file_exists($f)) @unlink($f);
        }

        echo json_encode(['success' => true, 'deleted' => $id]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Missing slip id to delete']);
    exit;
}

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);

    if (!$body || !isset($body['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid slip payload']);
        exit;
    }

    // Convert base64 addaLogo to real image file for WhatsApp crawler compatibility
    if (isset($body['addaLogo']) && strpos($body['addaLogo'], 'data:image/') === 0) {
        $uploadDir = __DIR__ . '/../uploads';
        if (!file_exists($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }
        if (is_dir($uploadDir) && is_writable($uploadDir)) {
            preg_match('/^data:image\/(\w+);base64,/', $body['addaLogo'], $type);
            $ext = isset($type[1]) ? strtolower($type[1]) : 'png';
            if ($ext === 'jpeg') $ext = 'jpg';
            $data = substr($body['addaLogo'], strpos($body['addaLogo'], ',') + 1);
            $decoded = base64_decode($data);
            if ($decoded !== false) {
                $safeName = 'adda_' . md5($body['id'] . (isset($body['addaName']) ? $body['addaName'] : '')) . '.' . $ext;
                @file_put_contents($uploadDir . '/' . $safeName, $decoded);
                $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https://' : 'https://';
                $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'pkcargolink.com';
                $body['addaLogo'] = $protocol . $host . '/uploads/' . $safeName;
            }
        }
    }

    $slips = readAllSlips();
    $found = false;

    foreach ($slips as $key => $s) {
        if (isset($s['id']) && $s['id'] === $body['id']) {
            $slips[$key] = $body;
            $found = true;
            break;
        }
    }

    if (!$found) {
        array_unshift($slips, $body);
    }

    writeAllSlips($slips);

    // Also write dedicated individual file for guaranteed instant lookup
    $cleanId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $body['id']);
    if (!empty($cleanId)) {
        $singleDirs = [
            __DIR__ . '/../data/slips',
            __DIR__ . '/data/slips',
            __DIR__ . '/slips',
            __DIR__ . '/../slips',
        ];
        foreach ($singleDirs as $sDir) {
            if (!file_exists($sDir)) @mkdir($sDir, 0777, true);
            if (is_dir($sDir) && is_writable($sDir)) {
                $payloadJson = json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                @file_put_contents($sDir . '/' . $cleanId . '.json', $payloadJson);
                $noHyphen = preg_replace('/[^a-zA-Z0-9]/', '', $body['id']);
                if (!empty($noHyphen)) {
                    @file_put_contents($sDir . '/' . $noHyphen . '.json', $payloadJson);
                }
            }
        }
    }

    echo json_encode(['success' => true, 'slip' => $body]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
