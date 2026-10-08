<?php
// PK Cargo Link — Private Load Chat API (1:1 adda manager <-> driver)
// Text messages + voice notes for an ACTIVE/accepted load only.
// Data: api/data/chat.json keyed by slip ID. Audio: uploads/chat/.
// Privacy: chat is scoped to a single slipId; the app only renders it
// for the two parties of that load (adda manager who posted it +
// driver who accepted it).
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function chatFile() {
    $candidates = [
        __DIR__ . '/data/chat.json',
        __DIR__ . '/../data/chat.json',
    ];
    foreach ($candidates as $p) {
        $dir = dirname($p);
        if (!file_exists($dir)) { @mkdir($dir, 0777, true); }
        if (is_dir($dir) && is_writable($dir)) return $p;
    }
    return __DIR__ . '/chat.json';
}

function chatUploadDir() {
    $candidates = [
        __DIR__ . '/../uploads/chat',
        __DIR__ . '/../../uploads/chat',
        __DIR__ . '/uploads/chat',
    ];
    foreach ($candidates as $d) {
        if (!file_exists($d)) { @mkdir($d, 0777, true); }
        if (is_dir($d) && is_writable($d)) return $d;
    }
    $d = __DIR__ . '/../uploads/chat';
    @mkdir($d, 0777, true);
    return $d;
}

function loadChat() {
    $f = chatFile();
    if (!file_exists($f)) return [];
    $raw = @file_get_contents($f);
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

function saveChat($data) {
    @file_put_contents(chatFile(), json_encode($data, JSON_UNESCAPED_UNICODE));
}

function cleanId($v) {
    return preg_replace('/[^a-zA-Z0-9]/', '', (string)$v);
}

function cleanRole($v) {
    $v = strtolower(trim((string)$v));
    return ($v === 'driver') ? 'driver' : 'adda';
}

// Prune chats with no messages in 30 days; cap 200 msgs per slip
function pruneChat($data) {
    $now = time();
    foreach ($data as $k => $msgs) {
        if (!is_array($msgs) || empty($msgs)) { unset($data[$k]); continue; }
        $last = end($msgs);
        $ts = isset($last['createdAt']) ? strtotime($last['createdAt']) : 0;
        if ($ts && ($now - $ts) > 30 * 24 * 3600) { unset($data[$k]); continue; }
        if (count($msgs) > 200) $data[$k] = array_slice($msgs, -200);
    }
    return $data;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'GET') {
    // ?action=get&slipId=PKCL...[&since=ISO] → messages for one load
    $slipId = cleanId(isset($_GET['slipId']) ? $_GET['slipId'] : '');
    if (!$slipId) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'slipId required']);
        exit;
    }
    $data = loadChat();
    $msgs = isset($data[$slipId]) && is_array($data[$slipId]) ? $data[$slipId] : [];
    $since = isset($_GET['since']) ? strtotime((string)$_GET['since']) : 0;
    if ($since) {
        $msgs = array_values(array_filter($msgs, function ($m) use ($since) {
            $ts = isset($m['createdAt']) ? strtotime($m['createdAt']) : 0;
            return $ts > $since;
        }));
    }
    echo json_encode(['ok' => true, 'messages' => array_values($msgs)], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $isMultipart = isset($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK;

    if ($isMultipart) {
        $slipId = cleanId(isset($_POST['slipId']) ? $_POST['slipId'] : '');
        $senderRole = cleanRole(isset($_POST['senderRole']) ? $_POST['senderRole'] : '');
        $senderName = mb_substr(trim((string)(isset($_POST['senderName']) ? $_POST['senderName'] : '')), 0, 80);
        $senderPhone = preg_replace('/[^0-9+]/', '', (string)(isset($_POST['senderPhone']) ? $_POST['senderPhone'] : ''));
        $file = $_FILES['audio'];

        if (!$slipId) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'slipId required']);
            exit;
        }

        // Audio only: webm / ogg / mp3 / m4a / wav, max ~5MB (voice note)
        $mime = @mime_content_type($file['tmp_name']);
        $allowed = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'video/webm'];
        if (!in_array($mime, $allowed)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid audio type']);
            exit;
        }
        if ($file['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Voice note too large (max 5MB)']);
            exit;
        }

        $ext = 'webm';
        if (strpos($mime, 'ogg') !== false) $ext = 'ogg';
        elseif (strpos($mime, 'mpeg') !== false) $ext = 'mp3';
        elseif (strpos($mime, 'mp4') !== false || strpos($mime, 'm4a') !== false) $ext = 'm4a';
        elseif (strpos($mime, 'wav') !== false) $ext = 'wav';

        $dir = chatUploadDir();
        $filename = 'voice_' . $slipId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $target = $dir . '/' . $filename;
        if (!@move_uploaded_file($file['tmp_name'], $target)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Upload failed']);
            exit;
        }

        // Public URL relative to site root
        $audioUrl = '/uploads/chat/' . $filename;

        $msg = [
            'id' => 'm_' . time() . '_' . bin2hex(random_bytes(4)),
            'slipId' => $slipId,
            'senderRole' => $senderRole,
            'senderName' => $senderName,
            'senderPhone' => $senderPhone,
            'kind' => 'voice',
            'audioUrl' => $audioUrl,
            'durationSec' => isset($_POST['durationSec']) ? (int)$_POST['durationSec'] : 0,
            'createdAt' => gmdate('c'),
        ];
        $data = loadChat();
        if (!isset($data[$slipId]) || !is_array($data[$slipId])) $data[$slipId] = [];
        $data[$slipId][] = $msg;
        $data = pruneChat($data);
        saveChat($data);
        echo json_encode(['ok' => true, 'message' => $msg], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // JSON text message
    $in = json_decode(@file_get_contents('php://input'), true);
    if (!is_array($in)) $in = $_POST;

    $slipId = cleanId(isset($in['slipId']) ? $in['slipId'] : '');
    $text = mb_substr(trim((string)(isset($in['text']) ? $in['text'] : '')), 0, 2000);
    if (!$slipId || $text === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'slipId and text required']);
        exit;
    }

    $msg = [
        'id' => 'm_' . time() . '_' . bin2hex(random_bytes(4)),
        'slipId' => $slipId,
        'senderRole' => cleanRole(isset($in['senderRole']) ? $in['senderRole'] : ''),
        'senderName' => mb_substr(trim((string)(isset($in['senderName']) ? $in['senderName'] : '')), 0, 80),
        'senderPhone' => preg_replace('/[^0-9+]/', '', (string)(isset($in['senderPhone']) ? $in['senderPhone'] : '')),
        'kind' => 'text',
        'text' => $text,
        'createdAt' => gmdate('c'),
    ];
    $data = loadChat();
    if (!isset($data[$slipId]) || !is_array($data[$slipId])) $data[$slipId] = [];
    $data[$slipId][] = $msg;
    $data = pruneChat($data);
    saveChat($data);
    echo json_encode(['ok' => true, 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'method not allowed']);
