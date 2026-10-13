<?php
// PK Cargo Link - Secure Admin Authentication
// Server-side PIN verification with brute-force protection
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Admin PIN - stored server-side only, never exposed to frontend
// TODO: Change this PIN and store as environment variable in production
define('ADMIN_PIN', 'wuW7J**Qu3N4k');

function getAttemptsFile() {
    return __DIR__ . '/admin_attempts.json';
}

function readAttempts() {
    $f = getAttemptsFile();
    if (!file_exists($f)) return [];
    $data = json_decode(@file_get_contents($f), true);
    return is_array($data) ? $data : [];
}

function writeAttempts($attempts) {
    @file_put_contents(getAttemptsFile(), json_encode($attempts), LOCK_EX);
}

function getClientIp() {
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function isBlocked($ip) {
    $attempts = readAttempts();
    if (!isset($attempts[$ip])) return false;
    
    $record = $attempts[$ip];
    // Block for 15 minutes after 5 failed attempts
    if ($record['count'] >= 5 && (time() - $record['last']) < 900) {
        return true;
    }
    // Reset count after 15 minutes
    if ((time() - $record['last']) >= 900) {
        unset($attempts[$ip]);
        writeAttempts($attempts);
        return false;
    }
    return false;
}

function recordFailedAttempt($ip) {
    $attempts = readAttempts();
    if (!isset($attempts[$ip])) {
        $attempts[$ip] = ['count' => 0, 'last' => time()];
    }
    $attempts[$ip]['count']++;
    $attempts[$ip]['last'] = time();
    writeAttempts($attempts);
}

function clearAttempts($ip) {
    $attempts = readAttempts();
    unset($attempts[$ip]);
    writeAttempts($attempts);
}

$ip = getClientIp();

// Check if IP is blocked
if (isBlocked($ip)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many failed attempts. Try again in 15 minutes.', 'blocked' => true]);
    exit;
}

$input = file_get_contents('php://input');
$body = json_decode($input, true);
$pin = $body['pin'] ?? '';

// Use hash_equals for timing-attack safe comparison
if (!empty($pin) && hash_equals(ADMIN_PIN, $pin)) {
    clearAttempts($ip);
    // Generate session token (valid for 8 hours)
    $token = bin2hex(random_bytes(32));
    $expiry = time() + (8 * 3600);
    
    // Store token
    $tokensFile = __DIR__ . '/admin_tokens.json';
    $tokens = [];
    if (file_exists($tokensFile)) {
        $tokens = json_decode(@file_get_contents($tokensFile), true) ?: [];
    }
    // Clean expired tokens
    $tokens = array_filter($tokens, fn($t) => $t['expiry'] > time());
    $tokens[$token] = ['expiry' => $expiry, 'ip' => $ip, 'created' => time()];
    @file_put_contents($tokensFile, json_encode($tokens), LOCK_EX);
    
    echo json_encode(['success' => true, 'token' => $token, 'expiresIn' => 8 * 3600]);
} else {
    recordFailedAttempt($ip);
    $attempts = readAttempts();
    $remaining = 5 - ($attempts[$ip]['count'] ?? 0);
    http_response_code(401);
    echo json_encode(['error' => 'Invalid PIN', 'attemptsRemaining' => max(0, $remaining)]);
}
