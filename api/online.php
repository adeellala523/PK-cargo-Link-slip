<?php
// PK Cargo Link - Live online users counter (admin panel only display)
// GET  -> {"online": N}                    (browsers with a heartbeat in the last 60s)
// POST -> {"visitor_id": "v_..."}          records/refreshes this browser's heartbeat
// Frontend pings every 45s; entries older than 60s are pruned.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('PKCL_ONLINE_TTL', 60); // seconds
$store = __DIR__ . '/online.json';

function pkcl_online_load($store) {
    if (!file_exists($store)) return array();
    $d = @json_decode(@file_get_contents($store), true);
    return is_array($d) ? $d : array();
}

function pkcl_online_save($store, $d) {
    @file_put_contents($store, json_encode($d, JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function pkcl_online_prune(&$d) {
    $now = time();
    foreach ($d as $k => $t) {
        if ($now - (int)$t > PKCL_ONLINE_TTL) unset($d[$k]);
    }
}

function pkcl_online_clean_vid($v) {
    $v = substr((string)$v, 0, 64);
    return preg_match('/^[A-Za-z0-9_.\-]+$/', $v) ? $v : '';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = @json_decode($raw, true);
    $vid = pkcl_online_clean_vid(is_array($body) && isset($body['visitor_id']) ? $body['visitor_id'] : '');
    if ($vid === '') {
        echo json_encode(array('error' => 'Missing visitor_id'), JSON_UNESCAPED_UNICODE);
        exit;
    }
    $data = pkcl_online_load($store);
    $data[$vid] = time();
    pkcl_online_prune($data);
    pkcl_online_save($store, $data);
    echo json_encode(array('success' => true, 'online' => count($data)), JSON_UNESCAPED_UNICODE);
    exit;
}

// GET
$data = pkcl_online_load($store);
pkcl_online_prune($data);
echo json_encode(array('online' => count($data)), JSON_UNESCAPED_UNICODE);
