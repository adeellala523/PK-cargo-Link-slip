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

// 2. If the Adda has an image (base64 or file or url), serve THAT Adda's exact picture!
if (!empty($logoUrl) && !isset($_GET['force_canvas'])) {
    // Handle data:image/ URI
    if (strpos($logoUrl, 'data:image/') === 0) {
        preg_match('/^data:image\/(\w+);base64,/', $logoUrl, $type);
        $ext = isset($type[1]) ? strtolower($type[1]) : 'png';
        if ($ext === 'jpeg') $ext = 'jpg';
        $data = substr($logoUrl, strpos($logoUrl, ',') + 1);
        $decoded = base64_decode($data);
        if ($decoded !== false) {
            header('Content-Type: image/' . ($ext === 'jpg' ? 'jpeg' : $ext));
            header('Cache-Control: public, max-age=86400');
            echo $decoded;
            exit;
        }
    }

    // Handle local uploaded files
    $localImagePath = null;
    if (strpos($logoUrl, '/uploads/') !== false) {
        $part = substr($logoUrl, strpos($logoUrl, '/uploads/'));
        if (file_exists(__DIR__ . '/..' . $part)) {
            $localImagePath = __DIR__ . '/..' . $part;
        } elseif (file_exists(__DIR__ . '/../..' . $part)) {
            $localImagePath = __DIR__ . '/../..' . $part;
        }
    }
    
    if ($localImagePath && file_exists($localImagePath)) {
        $mime = mime_content_type($localImagePath);
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=86400');
        readfile($localImagePath);
        exit;
    }
}

// 3. Generate a clean, premium transport medallion badge (not a webpage screenshot)
$width = 1200;
$height = 630;
$im = imagecreatetruecolor($width, $height);

// Premium Transport Palette
$bgNavy = imagecolorallocate($im, 7, 26, 50);       // Rich Deep Navy
$accentGreen = imagecolorallocate($im, 16, 185, 129); // Vibrant Emerald
$gold = imagecolorallocate($im, 245, 158, 11);       // Warm Amber Gold
$white = imagecolorallocate($im, 255, 255, 255);
$lightSlate = imagecolorallocate($im, 203, 213, 225);
$darkTeal = imagecolorallocate($im, 4, 47, 46);

// Background
imagefilledrectangle($im, 0, 0, $width, $height, $bgNavy);

// Outer Border
imagesetthickness($im, 8);
imagerectangle($im, 24, 24, $width - 24, $height - 24, $accentGreen);
imagesetthickness($im, 2);
imagerectangle($im, 34, 34, $width - 34, $height - 34, $gold);

// Top Ribbon
imagefilledrectangle($im, 200, 50, $width - 200, 110, $darkTeal);
imagerectangle($im, 200, 50, $width - 200, 110, $gold);

// Center Medallion Circle
$centerX = $width / 2;
$centerY = 260;
imagefilledellipse($im, $centerX, $centerY, 200, 200, $darkTeal);
imagesetthickness($im, 5);
imageellipse($im, $centerX, $centerY, 200, 200, $gold);
imagesetthickness($im, 2);
imageellipse($im, $centerX, $centerY, 180, 180, $accentGreen);

// Draw Truck Icon inside medallion using basic geometry
$truckX = $centerX - 50;
$truckY = $centerY - 25;
// Truck Cargo Body
imagefilledrectangle($im, $truckX, $truckY, $truckX + 65, $truckY + 45, $accentGreen);
imagerectangle($im, $truckX, $truckY, $truckX + 65, $truckY + 45, $white);
// Truck Cabin
imagefilledrectangle($im, $truckX + 68, $truckY + 12, $truckX + 100, $truckY + 45, $gold);
// Cabin Window
imagefilledrectangle($im, $truckX + 78, $truckY + 16, $truckX + 96, $truckY + 28, $bgNavy);
// Wheels
imagefilledellipse($im, $truckX + 20, $truckY + 50, 18, 18, $white);
imagefilledellipse($im, $truckX + 20, $truckY + 50, 8, 8, $bgNavy);
imagefilledellipse($im, $truckX + 50, $truckY + 50, 18, 18, $white);
imagefilledellipse($im, $truckX + 50, $truckY + 50, 8, 8, $bgNavy);
imagefilledellipse($im, $truckX + 85, $truckY + 50, 18, 18, $white);
imagefilledellipse($im, $truckX + 85, $truckY + 50, 8, 8, $bgNavy);

// Ribbon Text (English standard to guarantee clean, zero-distortion rendering on all systems)
imagestring($im, 5, $centerX - 130, 72, "GOODS TRANSPORT LOAD SLIP", $gold);

// Route Banner
imagefilledrectangle($im, 100, 400, $width - 100, 480, $darkTeal);
imagesetthickness($im, 3);
imagerectangle($im, 100, 400, $width - 100, 480, $accentGreen);

$routeText = "ROUTE: " . strtoupper($from) . "  TO  " . strtoupper($to);
imagestring($im, 5, $centerX - (strlen($routeText) * 4.5), 430, $routeText, $white);

// Contact Footer
$contactText = "CONTACT / BOOKING: " . $phone;
imagestring($im, 5, $centerX - (strlen($contactText) * 4.5), 520, $contactText, $gold);

$siteText = "pkcargolink.com";
imagestring($im, 4, $centerX - (strlen($siteText) * 4), 565, $siteText, $lightSlate);

imagepng($im);
imagedestroy($im);
exit;
