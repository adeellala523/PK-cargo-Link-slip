<?php
// PK Cargo Link - Users Persistent Sync for Hostinger
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/../../data';
if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$usersFile = $dataDir . '/users.json';

function readUsers($file) {
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

function writeUsers($file, $users) {
    $json = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return @file_put_contents($file, $json, LOCK_EX);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode(readUsers($usersFile), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);

    if (is_array($body)) {
        writeUsers($usersFile, $body);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Invalid data format']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
