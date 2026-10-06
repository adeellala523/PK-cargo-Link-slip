<?php
// PK Cargo Link - WhatsApp voice-note transcription via Gemini API.
// Receives an audio upload (multipart field "audio"), forwards it to Gemini
// for Urdu transcription, and returns { "transcript": "..." }.
//
// The API key is NEVER exposed to the client. It is read server-side from:
//   1. getenv('GEMINI_API_KEY'), else
//   2. ~/.config/gemini_api_key or ~/.gemini_key  (above public_html, not web-accessible)
// Without a key the endpoint answers 503 with {"error":"transcription_unavailable"}
// so the importer can degrade gracefully (voice notes are skipped, never crash).

header('Content-Type: application/json; charset=utf-8');

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed = array('https://pkcargolink.com', 'https://www.pkcargolink.com');
if (in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function fail($code, $msg) {
    http_response_code($code);
    echo json_encode(array('error' => $msg), JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'POST only');
}

function getApiKey() {
    $k = getenv('GEMINI_API_KEY');
    if ($k && trim($k) !== '') return trim($k);
    // Non-web-accessible locations ONLY: the HOME directory on Hostinger sits
    // ABOVE public_html, so these can never be fetched via HTTP.
    // (Deliberately NOT public_html/.gemini_key — dotfiles may be served.)
    $candidates = array();
    if (isset($_SERVER['HOME']) && $_SERVER['HOME'] !== '') {
        $home = rtrim($_SERVER['HOME'], '/');
        $candidates[] = $home . '/.config/gemini_api_key';
        $candidates[] = $home . '/.gemini_key';
    }
    foreach ($candidates as $f) {
        if (is_file($f)) {
            $v = trim((string) @file_get_contents($f));
            if ($v !== '') return $v;
        }
    }
    return '';
}

$apiKey = getApiKey();
if ($apiKey === '') {
    fail(503, 'transcription_unavailable');
}

if (!isset($_FILES['audio']) || !is_array($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    fail(400, 'no_audio');
}

// Size guard: 12 MB max (WhatsApp voice notes are small)
if ($_FILES['audio']['size'] > 12 * 1024 * 1024) {
    fail(400, 'audio_too_large');
}

$tmp = $_FILES['audio']['tmp_name'];
$audioBytes = @file_get_contents($tmp);
if ($audioBytes === false || strlen($audioBytes) === 0) {
    fail(400, 'audio_unreadable');
}

// Best-effort mime detection; WhatsApp voice notes are Opus-in-Ogg.
$mime = 'audio/ogg';
if (function_exists('mime_content_type')) {
    $detected = @mime_content_type($tmp);
    if ($detected && strpos($detected, 'audio/') === 0) $mime = $detected;
}

$payload = array(
    'contents' => array(
        array(
            'parts' => array(
                array('text' => 'Transcribe this voice note to Urdu text. It is a Pakistani cargo-transport message about a load or an empty vehicle. Return ONLY the transcription in Urdu script, no commentary, no translation.'),
                array('inlineData' => array(
                    'mimeType' => $mime,
                    'data' => base64_encode($audioBytes),
                )),
            ),
        ),
    ),
    'generationConfig' => array('temperature' => 0.1),
);

$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . urlencode($apiKey);
$body = json_encode($payload, JSON_UNESCAPED_UNICODE);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($resp === false || $resp === '') {
    fail(502, 'transcription_failed');
}

$json = json_decode($resp, true);
$transcript = '';
if (is_array($json) && isset($json['candidates'][0]['content']['parts'])) {
    foreach ($json['candidates'][0]['content']['parts'] as $part) {
        if (isset($part['text'])) $transcript .= $part['text'];
    }
}
$transcript = trim($transcript);

if ($httpCode !== 200 || $transcript === '') {
    // Never leak upstream error details (they may contain key fragments).
    fail(502, 'transcription_failed');
}

echo json_encode(array('transcript' => $transcript), JSON_UNESCAPED_UNICODE);
