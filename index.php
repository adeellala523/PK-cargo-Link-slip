<?php
// PK Cargo Link - Hostinger Auto-Deployment Bridge
// Automatically serves the compiled dist/ build if deployed to public_html root

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. If request is for slip preview, extract ID and route to slip.php
if (strpos($uri, '/slip/') === 0) {
    preg_match('#^/slip/([^/?]+)#', $uri, $m);
    if (!empty($m[1]) && !isset($_GET['id'])) {
        $_GET['id'] = $m[1];
    }
    if (file_exists(__DIR__ . '/slip.php')) {
        require __DIR__ . '/slip.php';
        exit;
    }
    if (file_exists(__DIR__ . '/dist/slip.php')) {
        require __DIR__ . '/dist/slip.php';
        exit;
    }
    if (file_exists(__DIR__ . '/public/slip.php')) {
        require __DIR__ . '/public/slip.php';
        exit;
    }
}

// 2. If request is for APIs
if (strpos($uri, '/api/slips') === 0) {
    preg_match('#^/api/slips/([^/?]+)#', $uri, $m);
    if (!empty($m[1]) && !isset($_GET['id'])) {
        $_GET['id'] = $m[1];
    }
    if (file_exists(__DIR__ . '/api/slips.php')) {
        require __DIR__ . '/api/slips.php';
        exit;
    }
    if (file_exists(__DIR__ . '/dist/api/slips.php')) {
        require __DIR__ . '/dist/api/slips.php';
        exit;
    }
}

if (strpos($uri, '/api/users-sync') === 0) {
    if (file_exists(__DIR__ . '/api/users.php')) {
        require __DIR__ . '/api/users.php';
        exit;
    }
    if (file_exists(__DIR__ . '/dist/api/users.php')) {
        require __DIR__ . '/dist/api/users.php';
        exit;
    }
}

if (strpos($uri, '/api/upload') === 0) {
    if (file_exists(__DIR__ . '/api/upload.php')) {
        require __DIR__ . '/api/upload.php';
        exit;
    }
    if (file_exists(__DIR__ . '/dist/api/upload.php')) {
        require __DIR__ . '/dist/api/upload.php';
        exit;
    }
}

if (strpos($uri, '/api/slip-image') === 0) {
    if (file_exists(__DIR__ . '/api/slip-image.php')) {
        require __DIR__ . '/api/slip-image.php';
        exit;
    }
    if (file_exists(__DIR__ . '/dist/api/slip-image.php')) {
        require __DIR__ . '/dist/api/slip-image.php';
        exit;
    }
}

if (strpos($uri, '/api/whatsapp-webhook') === 0) {
    if (file_exists(__DIR__ . '/api/whatsapp-webhook.php')) {
        require __DIR__ . '/api/whatsapp-webhook.php';
        exit;
    }
    if (file_exists(__DIR__ . '/dist/api/whatsapp-webhook.php')) {
        require __DIR__ . '/dist/api/whatsapp-webhook.php';
        exit;
    }
    if (file_exists(__DIR__ . '/public/api/whatsapp-webhook.php')) {
        require __DIR__ . '/public/api/whatsapp-webhook.php';
        exit;
    }
}

// 3. If file exists in dist, serve directly
if (!empty($uri) && $uri !== '/') {
    $targetFile = __DIR__ . '/dist' . $uri;
    if (file_exists($targetFile) && !is_dir($targetFile)) {
        $ext = pathinfo($targetFile, PATHINFO_EXTENSION);
        $mimes = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
            'json' => 'application/json',
            'ttf' => 'font/ttf',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
        ];
        if (isset($mimes[$ext])) {
            header('Content-Type: ' . $mimes[$ext]);
        }
        readfile($targetFile);
        exit;
    }
}

// 4. Default: Serve dist/index.html
if (file_exists(__DIR__ . '/dist/index.html')) {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    require_once __DIR__ . '/dist/index.html';
    exit;
}

// 5. Fallback minimal
echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PK Cargo Link</title></head><body><h1>PK Cargo Link</h1><p>Building applet...</p></body></html>';
?>
