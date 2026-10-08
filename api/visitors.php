<?php
// PK Cargo Link - Daily UNIQUE visitor counter (displayed in admin panel only)
// POST {"visitor_id": "v_..."}  -> records one visit for today (unique per browser)
// GET  ?action=today           -> {"visitors": N}   unique visitors today (Asia/Karachi)
// GET  ?action=week            -> {"week": {"2026-10-02": N, ...}} last 7 days
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Karachi');
$store = __DIR__ . '/visitors.json';
define('PKCL_VISITORS_KEEP_DAYS', 30);

function pkcl_vis_load($store) {
    if (!file_exists($store)) return array();
    $d = @json_decode(@file_get_contents($store), true);
    return is_array($d) ? $d : array();
}

function pkcl_vis_save($store, $d) {
    @file_put_contents($store, json_encode($d, JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// Drop day-buckets older than the retention window
function pkcl_vis_prune(&$d) {
    $cutoff = date('Y-m-d', time() - PKCL_VISITORS_KEEP_DAYS * 86400);
    foreach ($d as $day => $vids) {
        if ($day < $cutoff) unset($d[$day]);
    }
}

function pkcl_vis_clean_vid($v) {
    $v = substr((string)$v, 0, 64);
    return preg_match('/^[A-Za-z0-9_.\-]+$/', $v) ? $v : '';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = @json_decode($raw, true);
    $vid = pkcl_vis_clean_vid(is_array($body) && isset($body['visitor_id']) ? $body['visitor_id'] : '');
    if ($vid === '') {
        echo json_encode(array('error' => 'Missing visitor_id'), JSON_UNESCAPED_UNICODE);
        exit;
    }
    $data = pkcl_vis_load($store);
    $today = date('Y-m-d');
    if (!isset($data[$today]) || !is_array($data[$today])) $data[$today] = array();
    $data[$today][$vid] = time();
    pkcl_vis_prune($data);
    pkcl_vis_save($store, $data);
    echo json_encode(array('success' => true, 'visitors' => count($data[$today])), JSON_UNESCAPED_UNICODE);
    exit;
}

// GET
$action = isset($_GET['action']) ? $_GET['action'] : 'today';
$data = pkcl_vis_load($store);

if ($action === 'week') {
    $week = array();
    for ($i = 6; $i >= 0; $i--) {
        $day = date('Y-m-d', time() - $i * 86400);
        $week[$day] = (isset($data[$day]) && is_array($data[$day])) ? count($data[$day]) : 0;
    }
    echo json_encode(array('week' => $week), JSON_UNESCAPED_UNICODE);
    exit;
}

$today = date('Y-m-d');
$count = (isset($data[$today]) && is_array($data[$today])) ? count($data[$today]) : 0;
echo json_encode(array('visitors' => $count), JSON_UNESCAPED_UNICODE);
