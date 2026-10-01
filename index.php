<?php
// PK Cargo Link - Hostinger Auto-Deployment Bridge
// Automatically serves the compiled dist/ build if deployed to public_html root

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. If request is for slip preview, route to slip.php
if (strpos($uri, '/slip/') === 0) {
    if (file_exists(__DIR__ . '/dist/slip.php')) {
        require_once __DIR__ . '/dist/slip.php';
        exit;
    }
    if (file_exists(__DIR__ . '/public/slip.php')) {
        require_once __DIR__ . '/public/slip.php';
        exit;
    }
}

// 2. If request is for API slips or users
if (strpos($uri, '/api/slips') === 0 && file_exists(__DIR__ . '/dist/api/slips.php')) {
    require_once __DIR__ . '/dist/api/slips.php';
    exit;
}
if (strpos($uri, '/api/users-sync') === 0 && file_exists(__DIR__ . '/dist/api/users.php')) {
    require_once __DIR__ . '/dist/api/users.php';
    exit;
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
