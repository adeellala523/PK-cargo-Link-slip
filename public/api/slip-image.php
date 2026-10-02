<?php
// PK Cargo Link - Dynamic High-Resolution Open Graph Image Generator for Slips & Addas
header('Content-Type: image/png');
header('Cache-Control: public, max-age=86400');

$slipId = isset($_GET['id']) ? trim($_GET['id']) : '';

// 1. Search for slip data
$candidatePaths = [
    __DIR__ . '/../data/slips.json',
    __DIR__ . '/../../data/slips.json',
    __DIR__ . '/data/slips.json',
    __DIR__ . '/slips.json',
    __DIR__ . '/../slips.json',
];

$slip = null;
foreach ($candidatePaths as $path) {
    if (file_exists($path)) {
        $json = @file_get_contents($path);
        if ($json) {
            $slips = json_decode($json, true);
            if (is_array($slips)) {
                foreach ($slips as $s) {
                    if (isset($s['id']) && strtolower($s['id']) === strtolower($slipId)) {
                        $slip = $s;
                        break 2;
                    }
                }
            }
        }
    }
}

$addaName = isset($slip['addaName']) ? $slip['addaName'] : (isset($_GET['a']) ? $_GET['a'] : 'پاکستان کارگو و گڈز اڈا');
$addaCity = isset($slip['addaCity']) ? $slip['addaCity'] : (isset($_GET['c']) ? $_GET['c'] : 'پاکستان');
$from = isset($slip['loadingCity']) ? $slip['loadingCity'] : (isset($_GET['from']) ? $_GET['from'] : 'لوڈنگ مقام');
$to = isset($slip['destinationCity']) ? $slip['destinationCity'] : (isset($_GET['to']) ? $_GET['to'] : 'منزل');
$goods = isset($slip['goods']) ? $slip['goods'] : (isset($_GET['g']) ? $_GET['g'] : 'کارگو مال');
$weight = isset($slip['weight']) ? $slip['weight'] : (isset($_GET['w']) ? $_GET['w'] : '');
$vehicle = isset($slip['vehicleType']) ? $slip['vehicleType'] : (isset($_GET['v']) ? $_GET['v'] : 'ٹرک / ٹرالر');
$phone = isset($slip['primaryPhone']) ? $slip['primaryPhone'] : (isset($_GET['p']) ? $_GET['p'] : '0300-XXXXXXX');
$logoUrl = isset($slip['addaLogo']) ? $slip['addaLogo'] : '';

// If the Adda has a direct uploaded image file that exists, check if we can serve it directly:
if ($logoUrl && strpos($logoUrl, 'data:') !== 0 && !isset($_GET['force_canvas'])) {
    $localImagePath = null;
    if (strpos($logoUrl, '/uploads/') !== false) {
        $part = substr($logoUrl, strpos($logoUrl, '/uploads/'));
        if (file_exists(__DIR__ . '/..' . $part)) {
            $localImagePath = __DIR__ . '/..' . $part;
        } elseif (file_exists(__DIR__ . '/../..' . $part)) {
            $localImagePath = __DIR__ . '/../..' . $part;
        }
    }
    
    // If local adda image exists and user wants adda image directly:
    if ($localImagePath && file_exists($localImagePath)) {
        $mime = mime_content_type($localImagePath);
        header('Content-Type: ' . $mime);
        readfile($localImagePath);
        exit;
    }
}

// 2. Generate a custom 1200x630 OpenGraph Banner Image using GD
$width = 1200;
$height = 630;
$im = imagecreatetruecolor($width, $height);

// Colors
$bgDark = imagecolorallocate($im, 11, 37, 69);     // #0B2545 Dark Blue
$bgNavy = imagecolorallocate($im, 6, 24, 45);     // Darker Navy
$green = imagecolorallocate($im, 22, 163, 74);     // #16A34A Emerald Green
$lightGreen = imagecolorallocate($im, 34, 197, 94); // Light Green
$white = imagecolorallocate($im, 255, 255, 255);
$amber = imagecolorallocate($im, 245, 158, 11);    // Amber
$slateLight = imagecolorallocate($im, 226, 232, 240);
$cardBg = imagecolorallocate($im, 15, 48, 88);

// Fill Background with deep navy
imagefilledrectangle($im, 0, 0, $width, $height, $bgDark);

// Draw Top Emerald Accent Bar
imagefilledrectangle($im, 0, 0, $width, 16, $green);

// Inner Card Container
imagefilledrectangle($im, 40, 45, $width - 40, $height - 45, $cardBg);

// Card Border
imagesetthickness($im, 4);
imagerectangle($im, 40, 45, $width - 40, $height - 45, $green);

// Top Badge Banner
imagefilledrectangle($im, 70, 75, $width - 70, 140, $bgNavy);
imagerectangle($im, 70, 75, $width - 70, 140, $lightGreen);

// Font for text
$fontPath = __DIR__ . '/../fonts/nafeesweb.ttf';
if (!file_exists($fontPath)) {
    $fontPath = __DIR__ . '/../../public/fonts/nafeesweb.ttf';
}

if (file_exists($fontPath) && function_exists('imagettftext')) {
    // Top Verified Badge
    imagettftext($im, 20, 0, 100, 118, $amber, $fontPath, "★  مصدقہ گڈز ٹرانسپورٹ اڈا  |  PK CARGO LINK");
    imagettftext($im, 18, 0, 850, 118, $slateLight, $fontPath, "سلپ: " . $slipId);

    // Large Bold Adda Name
    imagettftext($im, 38, 0, 100, 230, $white, $fontPath, $addaName);
    imagettftext($im, 22, 0, 100, 280, $lightGreen, $fontPath, "📍 مقام اڈا: " . $addaCity);

    // Route Box
    imagefilledrectangle($im, 70, 315, $width - 70, 420, $bgNavy);
    imagerectangle($im, 70, 315, $width - 70, 420, $green);
    imagettftext($im, 28, 0, 100, 380, $white, $fontPath, "🚛 روٹ: " . $from . "  تا  " . $to);

    // Load Details Box
    imagettftext($im, 24, 0, 100, 475, $slateLight, $fontPath, "📦 مال: " . $goods . ($weight ? " (" . $weight . ")" : ""));
    imagettftext($im, 24, 0, 680, 475, $amber, $fontPath, "🚚 گاڑی: " . $vehicle);

    // Bottom Contact Bar
    imagefilledrectangle($im, 70, 520, $width - 70, 575, $green);
    imagettftext($im, 24, 0, 100, 560, $white, $fontPath, "📞 اڈا رابطہ نمبر: " . $phone);
    imagettftext($im, 20, 0, 750, 560, $white, $fontPath, "pkcargolink.com/slip/" . $slipId);
} else {
    // Fallback using built-in system fonts
    imagestring($im, 5, 100, 100, "PK CARGO LINK - VERIFIED GOODS TRANSPORT", $amber);
    imagestring($im, 5, 100, 180, "ADDA: " . $addaName . " (" . $addaCity . ")", $white);
    imagestring($im, 5, 100, 240, "ROUTE: " . $from . " -> " . $to, $lightGreen);
    imagestring($im, 5, 100, 300, "CARGO: " . $goods . " | VEHICLE: " . $vehicle, $slateLight);
    imagestring($im, 5, 100, 360, "CONTACT PHONE: " . $phone, $white);
    imagestring($im, 4, 100, 540, "pkcargolink.com/slip/" . $slipId, $amber);
}

imagepng($im);
imagedestroy($im);
?>
