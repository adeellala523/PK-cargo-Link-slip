<?php
// PK Cargo Link - Dynamic Open Graph Preview & Slip Page Handler for WhatsApp & Social Media
header('Content-Type: text/html; charset=utf-8');

$slipId = isset($_GET['id']) ? trim($_GET['id']) : '';
if (empty($slipId) && isset($_SERVER['REQUEST_URI'])) {
    $uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/slip/([^/?]+)#', $uriPath, $matches)) {
        $slipId = trim($matches[1]);
        $_GET['id'] = $slipId;
    }
}

$protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https://' : 'https://';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'pkcargolink.com';
$siteUrl = $protocol . $host;

// Default empty fields
$addaName = isset($_GET['a']) ? trim($_GET['a']) : '';
$loadingCity = isset($_GET['from']) ? trim($_GET['from']) : '';
$destinationCity = isset($_GET['to']) ? trim($_GET['to']) : '';
$goods = isset($_GET['g']) ? trim($_GET['g']) : '';
$weight = isset($_GET['w']) ? trim($_GET['w']) : '';
$vehicle = isset($_GET['v']) ? trim($_GET['v']) : '';
$phone = isset($_GET['p']) ? trim($_GET['p']) : '';
$city = isset($_GET['c']) ? trim($_GET['c']) : '';
$logoFromParam = isset($_GET['img']) ? trim($_GET['img']) : '';
$image = '';

$docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : __DIR__;
$cleanSlipId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $slipId);

// 1. First check individual dedicated slip files (instant lookup)
$singleSlipCandidates = [
    __DIR__ . '/data/slips/' . $cleanSlipId . '.json',
    __DIR__ . '/../data/slips/' . $cleanSlipId . '.json',
    __DIR__ . '/slips/' . $cleanSlipId . '.json',
    __DIR__ . '/api/slips/' . $cleanSlipId . '.json',
    $docRoot . '/data/slips/' . $cleanSlipId . '.json',
    $docRoot . '/slips/' . $cleanSlipId . '.json',
];

$foundSlip = null;
foreach ($singleSlipCandidates as $sFile) {
    if (!empty($cleanSlipId) && file_exists($sFile)) {
        $sContent = @file_get_contents($sFile);
        if ($sContent) {
            $parsed = json_decode($sContent, true);
            if (is_array($parsed) && isset($parsed['id'])) {
                $foundSlip = $parsed;
                break;
            }
        }
    }
}

// 2. Search candidate paths for slips.json
if (!$foundSlip) {
    $candidatePaths = [
        __DIR__ . '/data/slips.json',
        __DIR__ . '/../data/slips.json',
        __DIR__ . '/../../data/slips.json',
        __DIR__ . '/api/slips.json',
        __DIR__ . '/api/data/slips.json',
        __DIR__ . '/../api/slips.json',
        __DIR__ . '/slips.json',
        __DIR__ . '/../slips.json',
        $docRoot . '/data/slips.json',
        $docRoot . '/dist/data/slips.json',
        $docRoot . '/api/slips.json',
        $docRoot . '/dist/api/slips.json',
        $docRoot . '/slips.json',
        $docRoot . '/dist/slips.json',
    ];

    foreach ($candidatePaths as $file) {
        if (file_exists($file)) {
            $json = @file_get_contents($file);
            if ($json) {
                $slips = json_decode($json, true);
                if (is_array($slips)) {
                    foreach ($slips as $s) {
                        if (isset($s['id']) && strtolower($s['id']) === strtolower($slipId)) {
                            $foundSlip = $s;
                            break 2;
                        }
                    }
                }
            }
        }
    }
}

if ($foundSlip) {
    if (empty($addaName) && !empty($foundSlip['addaName'])) $addaName = $foundSlip['addaName'];
    if (empty($city) && !empty($foundSlip['addaCity'])) $city = $foundSlip['addaCity'];
    if (empty($loadingCity) && !empty($foundSlip['loadingCity'])) $loadingCity = $foundSlip['loadingCity'];
    if (empty($destinationCity) && !empty($foundSlip['destinationCity'])) $destinationCity = $foundSlip['destinationCity'];
    if (empty($goods) && !empty($foundSlip['goods'])) $goods = $foundSlip['goods'];
    if (empty($weight) && !empty($foundSlip['weight'])) $weight = $foundSlip['weight'];
    if (empty($vehicle) && !empty($foundSlip['vehicleType'])) $vehicle = $foundSlip['vehicleType'];
    if (empty($phone) && !empty($foundSlip['primaryPhone'])) $phone = $foundSlip['primaryPhone'];
    if (!empty($foundSlip['addaLogo'])) $image = $foundSlip['addaLogo'];
}

// 2. If logo is still empty, search users.json for Adda's profile image by matching phone or addaName
if (empty($image)) {
    $userPaths = [
        __DIR__ . '/data/users.json',
        __DIR__ . '/../data/users.json',
        __DIR__ . '/../../data/users.json',
        __DIR__ . '/api/users.json',
        __DIR__ . '/api/data/users.json',
        __DIR__ . '/../api/users.json',
        __DIR__ . '/users.json',
        $docRoot . '/data/users.json',
        $docRoot . '/dist/data/users.json',
        $docRoot . '/api/users.json',
        $docRoot . '/dist/api/users.json',
    ];

    foreach ($userPaths as $uFile) {
        if (file_exists($uFile)) {
            $uJson = @file_get_contents($uFile);
            if ($uJson) {
                $users = json_decode($uJson, true);
                if (is_array($users)) {
                    foreach ($users as $u) {
                        $matchPhone = !empty($phone) && isset($u['phone']) && preg_replace('/[^0-9]/', '', $u['phone']) === preg_replace('/[^0-9]/', '', $phone);
                        $matchName = !empty($addaName) && isset($u['addaName']) && trim($u['addaName']) === trim($addaName);
                        if ($matchPhone || $matchName) {
                            if (!empty($u['logoUrl'])) {
                                $image = $u['logoUrl'];
                            }
                            if (empty($addaName) && !empty($u['addaName'])) $addaName = $u['addaName'];
                            if (empty($city) && !empty($u['city'])) $city = $u['city'];
                            break 2;
                        }
                    }
                }
            }
        }
    }
}

if (!empty($logoFromParam) && empty($image)) {
    $image = $logoFromParam;
}

// 3. Handle Base64 Uploaded Image -> Convert to Real Public File for WhatsApp Crawler
if (!empty($image) && strpos($image, 'data:image/') === 0) {
    preg_match('/^data:image\/(\w+);base64,/', $image, $type);
    $ext = isset($type[1]) ? strtolower($type[1]) : 'png';
    if ($ext === 'jpeg') $ext = 'jpg';
    
    $base64 = substr($image, strpos($image, ',') + 1);
    $decoded = base64_decode($base64);

    if ($decoded !== false) {
        $candidateUploadDirs = [
            __DIR__ . '/uploads',
            __DIR__ . '/../uploads',
            $docRoot . '/uploads',
        ];
        $targetUploadDir = null;
        foreach ($candidateUploadDirs as $uDir) {
            if (!file_exists($uDir)) @mkdir($uDir, 0777, true);
            if (is_dir($uDir) && is_writable($uDir)) {
                $targetUploadDir = $uDir;
                break;
            }
        }
        if (!$targetUploadDir) {
            $targetUploadDir = __DIR__ . '/uploads';
            @mkdir($targetUploadDir, 0777, true);
        }

        $safeFile = 'adda_' . md5($slipId . $addaName . $phone) . '.' . $ext;
        @file_put_contents($targetUploadDir . '/' . $safeFile, $decoded);
        $image = $siteUrl . '/uploads/' . $safeFile;
    }
}

// Ensure $image is an absolute URL
if (!empty($image)) {
    if (strpos($image, 'http') !== 0) {
        $image = $siteUrl . (strpos($image, '/') === 0 ? '' : '/') . $image;
    }
}

// 4. If no specific custom logo exists, point to the dynamic OpenGraph banner generator for this exact slip!
if (empty($image) || strpos($image, 'icon-512.png') !== false || strpos($image, 'adda-logo.png') !== false) {
    $image = $siteUrl . '/api/slip-image.php?id=' . urlencode($slipId) . '&a=' . urlencode($addaName) . '&c=' . urlencode($city) . '&from=' . urlencode($loadingCity) . '&to=' . urlencode($destinationCity) . '&g=' . urlencode($goods) . '&w=' . urlencode($weight) . '&v=' . urlencode($vehicle) . '&p=' . urlencode($phone);
}

// 5. Fallback titles
if (empty($addaName)) $addaName = "گڈز ٹرانسپورٹ اڈا";
if (empty($loadingCity)) $loadingCity = "روٹ";
if (empty($destinationCity)) $destinationCity = "پاکستان";
if (empty($goods)) $goods = "دستیاب کارگو مال";
if (empty($vehicle)) $vehicle = "ٹرک / ٹرالر";
if (empty($phone)) $phone = "رابطہ نمبر";

// Prominent Titles
$title = htmlspecialchars($addaName . " – دستیاب لوڈ: " . $loadingCity . " تا " . $destinationCity, ENT_QUOTES, 'UTF-8');
$description = htmlspecialchars("مال: " . $goods . ($weight ? " (" . $weight . ")" : "") . " | مطلوبہ گاڑی: " . $vehicle . " | اڈا: " . $addaName . ($city ? " (" . $city . ")" : "") . " | فون: " . $phone, ENT_QUOTES, 'UTF-8');
$canonicalUrl = htmlspecialchars($siteUrl . "/slip/" . $slipId, ENT_QUOTES, 'UTF-8');
$siteNameEscaped = htmlspecialchars($addaName, ENT_QUOTES, 'UTF-8');

// 6. Read and inject into index.html
$indexCandidates = [
    __DIR__ . '/index.html',
    __DIR__ . '/../index.html',
    $docRoot . '/index.html',
    $docRoot . '/dist/index.html',
];

$html = null;
foreach ($indexCandidates as $idx) {
    if (file_exists($idx)) {
        $html = @file_get_contents($idx);
        if ($html) break;
    }
}

if ($html) {
    // Generate clean, high-priority OpenGraph tags
    $ogMeta = '
    <!-- WhatsApp & Social Media Dynamic Adda Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="' . $siteNameEscaped . '" />
    <meta property="og:title" content="' . $title . '" />
    <meta property="og:description" content="' . $description . '" />
    <meta property="og:image" content="' . $image . '" />
    <meta property="og:image:secure_url" content="' . $image . '" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="' . $canonicalUrl . '" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="' . $siteNameEscaped . '" />
    <meta name="twitter:title" content="' . $title . '" />
    <meta name="twitter:description" content="' . $description . '" />
    <meta name="twitter:image" content="' . $image . '" />
    ';

    // Strip default placeholder tags so WhatsApp only sees the Adda's exact details
    $html = preg_replace('/<meta\s+property="og:title"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+property="og:description"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+property="og:image"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+property="og:image:secure_url"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+property="og:site_name"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+property="og:url"[^>]*>/i', '', $html);
    $html = preg_replace('/<meta\s+name="twitter:[^>]*>/i', '', $html);
    $html = preg_replace('/<title>.*?<\/title>/i', '<title>' . $title . '</title>', $html);

    // Inject before </head>
    $html = str_replace('</head>', $ogMeta . "\n</head>", $html);
    echo $html;
} else {
    // Minimal fallback for crawlers
    echo '<!DOCTYPE html><html lang="ur" dir="rtl"><head>';
    echo '<meta charset="UTF-8">';
    echo '<title>' . $title . '</title>';
    echo '<meta property="og:site_name" content="' . $siteNameEscaped . '" />';
    echo '<meta property="og:title" content="' . $title . '" />';
    echo '<meta property="og:description" content="' . $description . '" />';
    echo '<meta property="og:image" content="' . $image . '" />';
    echo '<meta property="og:url" content="' . $canonicalUrl . '" />';
    echo '<meta name="twitter:card" content="summary_large_image" />';
    echo '<meta name="twitter:image" content="' . $image . '" />';
    echo '</head><body>';
    echo '<h1>' . $title . '</h1>';
    echo '<p>' . $description . '</p>';
    echo '<img src="' . $image . '" alt="' . $title . '" />';
    echo '<br><a href="' . $canonicalUrl . '">مکمل لوڈ سلپ دیکھنے کے لیے یہاں کلک کریں</a>';
    echo '</body></html>';
}
?>
