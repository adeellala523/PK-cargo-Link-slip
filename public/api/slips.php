<?php
// PK Cargo Link - Slips Persistent Storage API for Hostinger
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getWritableSlipsFile() {
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
            return $dir . '/slips.json';
        }
    }
    return __DIR__ . '/slips.json';
}

function readAllSlips() {
    $candidatePaths = [
        __DIR__ . '/../data/slips.json',
        __DIR__ . '/../../data/slips.json',
        __DIR__ . '/data/slips.json',
        __DIR__ . '/slips.json',
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

function writeAllSlips($slips) {
    $targetFile = getWritableSlipsFile();
    $json = json_encode($slips, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = @file_put_contents($targetFile, $json, LOCK_EX);
    
    $backupFile = __DIR__ . '/slips.json';
    if ($targetFile !== $backupFile) {
        @file_put_contents($backupFile, $json, LOCK_EX);
    }
    
    return $result !== false;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode(readAllSlips(), JSON_UNESCAPED_UNICODE);
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
    echo json_encode(['success' => true, 'slip' => $body]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
