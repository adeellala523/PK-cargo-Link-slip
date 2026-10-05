<?php
// PK Cargo Link - Available Trucks / Vehicles Persistent Storage API for Hostinger
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getAllPossibleTrucksPaths() {
    return [
        __DIR__ . '/trucks.json',
        __DIR__ . '/../data/trucks.json',
        __DIR__ . '/../../data/trucks.json',
        __DIR__ . '/data/trucks.json',
    ];
}

function readAllTrucks() {
    $paths = getAllPossibleTrucksPaths();
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
            if (is_array($parsed)) return $parsed;
        }
    }
    return [];
}

function writeAllTrucks($trucks) {
    $json = json_encode($trucks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $paths = getAllPossibleTrucksPaths();
    $written = false;

    foreach ($paths as $file) {
        $dir = dirname($file);
        if (!file_exists($dir)) @mkdir($dir, 0777, true);
        $res = @file_put_contents($file, $json, LOCK_EX);
        if ($res !== false) $written = true;
    }
    return $written;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode(readAllTrucks(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $truck = json_decode($rawInput, true);

    if (empty($truck) || empty($truck['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing truck id']);
        exit;
    }

    $trucks = readAllTrucks();
    $idx = -1;
    foreach ($trucks as $i => $t) {
        if ($t['id'] === $truck['id']) {
            $idx = $i;
            break;
        }
    }

    if ($idx !== -1) {
        $trucks[$idx] = array_merge($trucks[$idx], $truck);
    } else {
        array_unshift($trucks, $truck);
    }

    writeAllTrucks($trucks);
    echo json_encode(['success' => true, 'truck' => $truck], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    if (empty($id) && isset($_SERVER['REQUEST_URI'])) {
        $parts = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'));
        $lastPart = end($parts);
        if ($lastPart !== 'trucks' && $lastPart !== 'trucks.php') {
            $id = $lastPart;
        }
    }

    $trucks = readAllTrucks();
    $filtered = array_values(array_filter($trucks, function($t) use ($id) {
        return $t['id'] !== $id;
    }));

    writeAllTrucks($filtered);
    echo json_encode(['success' => true, 'remaining' => count($filtered)]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
