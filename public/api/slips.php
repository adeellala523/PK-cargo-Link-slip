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

// Persistent data directory outside repo clean path
$dataDir = __DIR__ . '/../../data';
if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$dataFile = $dataDir . '/slips.json';

// Helper to read slips
function readSlips($file) {
    if (file_exists($file)) {
        $content = @file_get_contents($file);
        if ($content) {
            $parsed = json_decode($content, true);
            if (is_array($parsed)) {
                return $parsed;
            }
        }
    }
    return [];
}

// Helper to write slips with atomic lock
function writeSlips($file, $slips) {
    $json = json_encode($slips, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return @file_put_contents($file, $json, LOCK_EX);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $slips = readSlips($dataFile);
    echo json_encode($slips, JSON_UNESCAPED_UNICODE);
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

    $slips = readSlips($dataFile);
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

    writeSlips($dataFile, $slips);
    echo json_encode(['success' => true, 'slip' => $body]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
