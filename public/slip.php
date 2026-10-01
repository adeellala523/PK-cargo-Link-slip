<?php
// PK Cargo Link - WhatsApp & Social Media Dynamic Open Graph Preview Handler for Hostinger
header('Content-Type: text/html; charset=utf-8');

$slipId = isset($_GET['id']) ? trim($_GET['id']) : '';
$siteUrl = 'https://pkcargolink.com';

// 1. First priority: Direct query parameters from WhatsApp link
$addaName = isset($_GET['a']) ? trim($_GET['a']) : '';
$loadingCity = isset($_GET['from']) ? trim($_GET['from']) : '';
$destinationCity = isset($_GET['to']) ? trim($_GET['to']) : '';
$goods = isset($_GET['g']) ? trim($_GET['g']) : '';
$weight = isset($_GET['w']) ? trim($_GET['w']) : '';
$vehicle = isset($_GET['v']) ? trim($_GET['v']) : '';
$phone = isset($_GET['p']) ? trim($_GET['p']) : '';
$city = isset($_GET['c']) ? trim($_GET['c']) : '';
$image = isset($_GET['img']) && !empty($_GET['img']) ? trim($_GET['img']) : ($siteUrl . '/adda-logo.png');

// 2. Second priority: Look up slip from server storage
$dataFile = __DIR__ . '/data/slips.json';
if (!file_exists($dataFile)) {
    $dataFile = __DIR__ . '/../data/slips.json';
}

if (file_exists($dataFile)) {
    $json = @file_get_contents($dataFile);
    if ($json) {
        $slips = json_decode($json, true);
        if (is_array($slips)) {
            foreach ($slips as $s) {
                if (isset($s['id']) && strtolower($s['id']) === strtolower($slipId)) {
                    if (empty($addaName) && !empty($s['addaName'])) $addaName = $s['addaName'];
                    if (empty($city) && !empty($s['addaCity'])) $city = $s['addaCity'];
                    if (empty($goods) && !empty($s['goods'])) $goods = $s['goods'];
                    if (empty($weight) && !empty($s['weight'])) $weight = $s['weight'];
                    if (empty($vehicle) && !empty($s['vehicleType'])) $vehicle = $s['vehicleType'];
                    if (empty($phone) && !empty($s['primaryPhone'])) $phone = $s['primaryPhone'];
                    if (empty($loadingCity) && !empty($s['loadingCity'])) $loadingCity = $s['loadingCity'];
                    if (empty($destinationCity) && !empty($s['destinationCity'])) $destinationCity = $s['destinationCity'];
                    if (!empty($s['addaLogo'])) {
                        $image = strpos($s['addaLogo'], 'http') === 0 ? $s['addaLogo'] : $siteUrl . $s['addaLogo'];
                    }
                    break;
                }
            }
        }
    }
}

// Sensible real defaults only if completely missing
if (empty($addaName)) $addaName = "پاکستان کارگو گڈز اڈا";
if (empty($loadingCity)) $loadingCity = "روٹ";
if (empty($destinationCity)) $destinationCity = "پاکستان";
if (empty($goods)) $goods = "دستیاب کارگو مال";
if (empty($weight)) $weight = "لوڈ";
if (empty($vehicle)) $vehicle = "ٹرک / ٹرالر";
if (empty($phone)) $phone = "اڈا رابطہ نمبر";

$title = htmlspecialchars($addaName . " – دستیاب لوڈ: " . $loadingCity . " تا " . $destinationCity, ENT_QUOTES, 'UTF-8');
$description = htmlspecialchars("مال: " . $goods . " (" . $weight . ") | مطلوبہ گاڑی: " . $vehicle . " | اڈا: " . $addaName . " | رابطہ: " . $phone, ENT_QUOTES, 'UTF-8');
$canonicalUrl = htmlspecialchars($siteUrl . "/slip/" . $slipId, ENT_QUOTES, 'UTF-8');
$siteNameEscaped = htmlspecialchars($addaName, ENT_QUOTES, 'UTF-8');

// Read the index.html template
$indexPath = __DIR__ . '/index.html';
if (file_exists($indexPath)) {
    $html = file_get_contents($indexPath);
    
    // Inject dynamic OpenGraph tags
    $ogMeta = '
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="' . $siteNameEscaped . '" />
    <meta property="og:title" content="' . $title . '" />
    <meta property="og:description" content="' . $description . '" />
    <meta property="og:image" content="' . $image . '" />
    <meta property="og:image:secure_url" content="' . $image . '" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta property="og:url" content="' . $canonicalUrl . '" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="' . $title . '" />
    <meta name="twitter:description" content="' . $description . '" />
    <meta name="twitter:image" content="' . $image . '" />
    ';
    
    // Replace default tags
    $html = preg_replace('/<meta\s+property="og:title"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+property="og:description"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+property="og:image"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+property="og:site_name"[^>]*>/i', '', $html);
    $html = str_replace('<title>', '<title>' . $title . ' - ', $html);
    $html = str_replace('</head>', $ogMeta . "\n</head>", $html);
    echo $html;
} else {
    // Fallback minimal HTML for crawlers
    echo '<!DOCTYPE html><html lang="ur" dir="rtl"><head>';
    echo '<meta charset="UTF-8">';
    echo '<title>' . $title . '</title>';
    echo '<meta property="og:site_name" content="' . $siteNameEscaped . '" />';
    echo '<meta property="og:title" content="' . $title . '" />';
    echo '<meta property="og:description" content="' . $description . '" />';
    echo '<meta property="og:image" content="' . $image . '" />';
    echo '<meta property="og:url" content="' . $canonicalUrl . '" />';
    echo '</head><body>';
    echo '<h1>' . $title . '</h1>';
    echo '<p>' . $description . '</p>';
    echo '<a href="' . $canonicalUrl . '">مکمل لوڈ سلپ دیکھنے کے لیے یہاں کلک کریں</a>';
    echo '</body></html>';
}
?>
