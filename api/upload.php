<?php
// PK Cargo Link - Direct Image Upload API for Adda Logos and Slips
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Candidate upload directories on Hostinger
$candidateDirs = [
    __DIR__ . '/../uploads',
    __DIR__ . '/../../uploads',
    __DIR__ . '/uploads',
    dirname(__DIR__) . '/uploads',
];

$uploadDir = null;
foreach ($candidateDirs as $dir) {
    if (!file_exists($dir)) {
        @mkdir($dir, 0777, true);
    }
    if (is_dir($dir) && is_writable($dir)) {
        $uploadDir = $dir;
        break;
    }
}

if (!$uploadDir) {
    $uploadDir = __DIR__ . '/../uploads';
    @mkdir($uploadDir, 0777, true);
}

// 1. Handle multipart/form-data file upload
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    $mime = mime_content_type($file['tmp_name']);
    if (!in_array($mime, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid image type. Allowed: JPG, PNG, WEBP']);
        exit;
    }

    $ext = 'png';
    if ($mime === 'image/jpeg') $ext = 'jpg';
    if ($mime === 'image/webp') $ext = 'webp';

    $filename = 'adda_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $targetPath = $uploadDir . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https://' : 'https://';
        $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'pkcargolink.com';
        $publicUrl = $protocol . $host . '/uploads/' . $filename;

        echo json_encode([
            'success' => true,
            'url' => $publicUrl,
            'filename' => $filename,
        ]);
        exit;
    }
}

// 2. Handle base64 JSON upload
$raw = file_get_contents('php://input');
if ($raw) {
    $body = json_decode($raw, true);
    if (isset($body['data']) && strpos($body['data'], 'data:image/') === 0) {
        preg_match('/^data:image\/(\w+);base64,/', $body['data'], $type);
        $ext = isset($type[1]) ? strtolower($type[1]) : 'png';
        if ($ext === 'jpeg') $ext = 'jpg';
        
        $base64 = substr($body['data'], strpos($body['data'], ',') + 1);
        $decoded = base64_decode($base64);

        if ($decoded !== false) {
            $prefix = isset($body['prefix']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $body['prefix']) : 'adda';
            $filename = $prefix . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $targetPath = $uploadDir . '/' . $filename;

            if (@file_put_contents($targetPath, $decoded)) {
                $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https://' : 'https://';
                $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'pkcargolink.com';
                $publicUrl = $protocol . $host . '/uploads/' . $filename;

                echo json_encode([
                    'success' => true,
                    'url' => $publicUrl,
                    'filename' => $filename,
                ]);
                exit;
            }
        }
    }
}

http_response_code(400);
echo json_encode(['error' => 'No valid image provided']);
?>
