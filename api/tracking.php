<?php
// PK Cargo Link — Live Truck Tracking API (Yango-style)
// Driver app POSTs GPS every 30s during an ACTIVE load; adda manager GETs latest position.
// Data: api/data/tracking.json keyed by slip ID.
// Privacy: location only exists while the driver shares it; auto-stops on complete/cancel.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function trackingFile() {
    $candidates = [
        __DIR__ . '/data/tracking.json',
        __DIR__ . '/../data/tracking.json',
    ];
    foreach ($candidates as $p) {
        $dir = dirname($p);
        if (!file_exists($dir)) { @mkdir($dir, 0777, true); }
        if (is_dir($dir) && is_writable($dir)) return $p;
    }
    return __DIR__ . '/tracking.json';
}

function loadTracking() {
    $f = trackingFile();
    if (!file_exists($f)) return [];
    $raw = @file_get_contents($f);
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

function saveTracking($data) {
    @file_put_contents(trackingFile(), json_encode($data, JSON_UNESCAPED_UNICODE));
}

function cleanId($v) {
    return preg_replace('/[^a-zA-Z0-9]/', '', (string)$v);
}

// Prune entries older than 6 hours (stale / phone died / app closed)
function pruneStale($data) {
    $now = time();
    foreach ($data as $k => $v) {
        $ts = isset($v['updatedAt']) ? strtotime($v['updatedAt']) : 0;
        if ($ts && ($now - $ts) > 6 * 3600) unset($data[$k]);
    }
    return $data;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'GET') {
    // ?action=get&slipId=PKCL...  → latest position for one load
    // ?action=all                 → all live positions (admin/debug)
    $data = pruneStale(loadTracking());
    if ($action === 'all') {
        echo json_encode(['ok' => true, 'tracking' => $data], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $slipId = cleanId(isset($_GET['slipId']) ? $_GET['slipId'] : '');
    if (!$slipId) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'slipId required']);
        exit;
    }
    $entry = isset($data[$slipId]) ? $data[$slipId] : null;
    echo json_encode(['ok' => true, 'tracking' => $entry], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $in = json_decode(@file_get_contents('php://input'), true);
    if (!is_array($in)) $in = $_POST;

    $slipId = cleanId(isset($in['slipId']) ? $in['slipId'] : '');
    if (!$slipId) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'slipId required']);
        exit;
    }

    $data = loadTracking();

    // Stop sharing: driver toggled OFF, or load completed/cancelled
    $sharing = isset($in['sharing']) ? (bool)$in['sharing'] : true;
    $done = isset($in['done']) ? (bool)$in['done'] : false;
    if (!$sharing || $done) {
        unset($data[$slipId]);
        saveTracking($data);
        echo json_encode(['ok' => true, 'stopped' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $lat = isset($in['lat']) ? (float)$in['lat'] : 0;
    $lng = isset($in['lng']) ? (float)$in['lng'] : 0;
    // Sanity: Pakistan bounding box roughly 23–37N, 61–78E
    if ($lat < 20 || $lat > 40 || $lng < 58 || $lng > 80) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'coordinates out of range']);
        exit;
    }

    $data[$slipId] = [
        'slipId'      => $slipId,
        'lat'         => $lat,
        'lng'         => $lng,
        'driverPhone' => preg_replace('/[^0-9+]/', '', (string)(isset($in['driverPhone']) ? $in['driverPhone'] : '')),
        'driverName'  => mb_substr((string)(isset($in['driverName']) ? $in['driverName'] : ''), 0, 80),
        'tripStatus'  => preg_replace('/[^a-z_]/', '', (string)(isset($in['tripStatus']) ? $in['tripStatus'] : 'in_transit')),
        'updatedAt'   => gmdate('c'),
    ];
    $data = pruneStale($data);
    saveTracking($data);
    echo json_encode(['ok' => true, 'tracking' => $data[$slipId]], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'method not allowed']);
