<?php
// PK Cargo Link - WhatsApp & Social Media Open Graph Preview Handler for Hostinger
header('Content-Type: text/html; charset=utf-8');

$slipId = isset($_GET['id']) ? trim($_GET['id']) : '';
$siteUrl = 'https://pkcargolink.com';

// Default metadata
$addaName = "نیو پنجاب کارگو گڈز اڈا";
$city = "ملتان";
$goods = "کرنل باسمتی چاول";
$weight = "30 ٹن";
$vehicle = "22 Wheeler";
$phone = "0300-7312345";
$loadingCity = "ملتان";
$destinationCity = "لاہور";
$image = $siteUrl . '/adda-logo.png';

// Try to read stored slips from data directory if exists
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
                    if (!empty($s['addaName'])) $addaName = $s['addaName'];
                    if (!empty($s['addaCity'])) $city = $s['addaCity'];
                    if (!empty($s['goods'])) $goods = $s['goods'];
                    if (!empty($s['weight'])) $weight = $s['weight'];
                    if (!empty($s['vehicleType'])) $vehicle = $s['vehicleType'];
                    if (!empty($s['primaryPhone'])) $phone = $s['primaryPhone'];
                    if (!empty($s['loadingCity'])) $loadingCity = $s['loadingCity'];
                    if (!empty($s['destinationCity'])) $destinationCity = $s['destinationCity'];
                    if (!empty($s['addaLogo'])) {
                        $image = strpos($s['addaLogo'], 'http') === 0 ? $s['addaLogo'] : $siteUrl . $s['addaLogo'];
                    }
                    break;
                }
            }
        }
    }
}

$title = htmlspecialchars($addaName . " – دستیاب لوڈ: " . $loadingCity . " تا " . $destinationCity, ENT_QUOTES, 'UTF-8');
$description = htmlspecialchars("مال: " . $goods . " (" . $weight . ") | مطلوبہ گاڑی: " . $vehicle . " | اڈا: " . $addaName . " (" . $city . ") | رابطہ: " . $phone, ENT_QUOTES, 'UTF-8');
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
    
    $html = str_replace('<title>', '<title>' . $title . ' - ', $html);
    $html = str_replace('</head>', $ogMeta . "\n</head>", $html);
    echo $html;
} else {
    // Fallback minimal HTML for crawlers
    echo '<!DOCTYPE html><html lang="ur" dir="rtl"><head>';
    echo '<meta charset="UTF-8">';
    echo '<title>' . $title . '</title>';
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
