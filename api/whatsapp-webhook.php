<?php
// PK Cargo Link - WhatsApp Automated Load Parser Webhook for Hostinger
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getAllPossibleSlipsPaths() {
    return [
        __DIR__ . '/slips.json',
        __DIR__ . '/../data/slips.json',
        __DIR__ . '/../../data/slips.json',
        __DIR__ . '/data/slips.json',
    ];
}

function readAllSlips() {
    $paths = getAllPossibleSlipsPaths();
    $bestFile = null;
    $bestMtime = 0;

    foreach ($paths as $file) {
        if (file_exists($file)) {
            $mtime = filemtime($file);
            if ($mtime >= $bestMtime) {
                $bestMtime = $mtime;
                $bestFile = $file;
            }
        }
    }

    if ($bestFile && file_exists($bestFile)) {
        $content = @file_get_contents($bestFile);
        if ($content) {
            $parsed = json_decode($content, true);
            if (is_array($parsed)) {
                return $parsed;
            }
        }
    }
    return [];
}

function writeAllSlips($slips) {
    $json = json_encode($slips, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $paths = getAllPossibleSlipsPaths();
    $written = false;

    foreach ($paths as $file) {
        $dir = dirname($file);
        if (!file_exists($dir)) {
            @mkdir($dir, 0777, true);
        }
        $res = @file_put_contents($file, $json, LOCK_EX);
        if ($res !== false) {
            $written = true;
        }
    }
    return $written;
}

// 1. Read input payload from POST JSON or Form-Data or GET query
$rawInput = file_get_contents('php://input');
$body = [];
if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $body = $decoded;
    }
}

$rawText = '';
if (!empty($body['text'])) $rawText = $body['text'];
elseif (!empty($body['message'])) $rawText = $body['message'];
elseif (!empty($body['body'])) $rawText = $body['body'];
elseif (!empty($body['caption'])) $rawText = $body['caption'];
elseif (!empty($body['content'])) $rawText = $body['content'];
elseif (!empty($_POST['text'])) $rawText = $_POST['text'];
elseif (!empty($_POST['message'])) $rawText = $_POST['message'];
elseif (!empty($_POST['body'])) $rawText = $_POST['body'];
elseif (!empty($_GET['text'])) $rawText = $_GET['text'];
elseif (!empty($rawInput) && is_string($rawInput) && !str_starts_with(trim($rawInput), '{')) {
    $rawText = $rawInput;
}

$rawText = trim($rawText);

if (empty($rawText)) {
    // If GET request without text parameter, show status JSON
    echo json_encode([
        'status' => 'active',
        'endpoint' => '/api/whatsapp-webhook.php',
        'method' => 'POST',
        'description' => 'PK Cargo Link automated WhatsApp load parser webhook is live on Hostinger.',
        'acceptedPayloads' => [
            ['text' => 'لاہور تا کراچی حاضر لوڈ 22 وہیلر 35 ٹن رابطہ 03044980373']
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// -----------------------------------------------------------------
// 2. STRICT FILTER: VALID PAKISTANI PHONE NUMBER (03xx-xxxxxxx)
// -----------------------------------------------------------------
preg_match_all('/(?:(?:\+92|92|0)?3\d{2}[- ]?\d{7})/', $rawText, $phoneMatches);
$cleanPhones = [];
if (!empty($phoneMatches[0])) {
    foreach ($phoneMatches[0] as $m) {
        $p = preg_replace('/[^0-9]/', '', $m);
        if (str_starts_with($p, '92')) $p = '0' . substr($p, 2);
        if (!str_starts_with($p, '0') && strlen($p) === 10) $p = '0' . $p;
        if (strlen($p) === 11 && str_starts_with($p, '03')) {
            $cleanPhones[] = $p;
        }
    }
}
$cleanPhones = array_values(array_unique($cleanPhones));

if (empty($cleanPhones)) {
    // Casual chat without a phone number is ignored, no return message sent
    echo json_encode([
        'success' => false,
        'ignored' => true,
        'reason' => 'عام چیٹ کو نظرانداز کر دیا گیا ہے (کوئی رابطہ فون نمبر موجود نہیں تھا)۔',
        'replies' => []
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$detectedPhone = $cleanPhones[0];
$additionalPhones = array_slice($cleanPhones, 1);

// -----------------------------------------------------------------
// 3. STRICT FILTER: TRANSPORT / CARGO KEYWORDS
// -----------------------------------------------------------------
$hasLoadKeywords = (bool) preg_match('/(?:لوڈ|load|مال|گاڑی|گاڑیاں|ٹرک|وہیلر|wheeler|ٹرائلر|trailer|ٹریلر|شہزور|shahzor|مزدا|mazda|ٹن|ton|tons|ٹنز|کنٹینر|container|بوریاں|تھیلے|کارٹن|کاٹن|حاضر\s*مال|تیار\s*مال|کرایہ|فریٹ|ان لوڈنگ|لوڈنگ)/ui', $rawText);

if (!$hasLoadKeywords) {
    echo json_encode([
        'success' => false,
        'ignored' => true,
        'reason' => 'عام بات چیت کو نظرانداز کر دیا گیا ہے (لوڈ یا گاڑی کا کوئی کی ورڈ نہیں تھا)۔',
        'replies' => []
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// -----------------------------------------------------------------
// 4. PARSE ROUTE & CITIES
// -----------------------------------------------------------------
$CITY_DICT = [
    ['canonical' => 'لاہور', 'aliases' => ['لاہور', 'lahore', 'lhr']],
    ['canonical' => 'کراچی', 'aliases' => ['کراچی', 'karachi', 'khi']],
    ['canonical' => 'فیصل آباد', 'aliases' => ['فیصل آباد', 'فیصلآباد', 'faisalabad', 'fsd']],
    ['canonical' => 'راولپنڈی', 'aliases' => ['راولپنڈی', 'rawalpindi', 'pindi']],
    ['canonical' => 'اسلام آباد', 'aliases' => ['اسلام آباد', 'islamabad', 'isb']],
    ['canonical' => 'ملتان', 'aliases' => ['ملتان', 'multan', 'mux']],
    ['canonical' => 'پشاور', 'aliases' => ['پشاور', 'peshawar', 'pew']],
    ['canonical' => 'کوئٹہ', 'aliases' => ['کوئٹہ', 'quetta']],
    ['canonical' => 'گوجرانوالہ', 'aliases' => ['گوجرانوالہ', 'gujranwala']],
    ['canonical' => 'سیالکوٹ', 'aliases' => ['سیالکوٹ', 'sialkot']],
    ['canonical' => 'بہاولپور', 'aliases' => ['بہاولپور', 'بہاول پور', 'bahawalpur', 'bhawalpur']],
    ['canonical' => 'سرگودھا', 'aliases' => ['سرگودھا', 'sargodha']],
    ['canonical' => 'سکھر', 'aliases' => ['سکھر', 'sukkur']],
    ['canonical' => 'جھنگ', 'aliases' => ['جھنگ', 'jhang']],
    ['canonical' => 'شیخوپورہ', 'aliases' => ['شیخوپورہ', 'sheikhupura']],
    ['canonical' => 'گجرات', 'aliases' => ['گجرات', 'gujrat']],
    ['canonical' => 'رحیم یار خان', 'aliases' => ['رحیم یار خان', 'رحیمیارخان', 'rahim yar khan', 'ryk']],
    ['canonical' => 'مردان', 'aliases' => ['مردان', 'mardan']],
    ['canonical' => 'قصور', 'aliases' => ['قصور', 'kasur']],
    ['canonical' => 'ڈیرہ غازی خان', 'aliases' => ['ڈیرہ غازی خان', 'ڈی جی خان', 'dg khan']],
    ['canonical' => 'ساہیوال', 'aliases' => ['ساہیوال', 'sahiwal']],
    ['canonical' => 'نواب شاہ', 'aliases' => ['نواب شاہ', 'nawabshah']],
    ['canonical' => 'اوکاڑہ', 'aliases' => ['اوکاڑہ', 'okara']],
    ['canonical' => 'خانیوال', 'aliases' => ['خانیوال', 'khanewal']],
    ['canonical' => 'کوہاٹ', 'aliases' => ['کوہاٹ', 'kohat']],
    ['canonical' => 'چنیوٹ', 'aliases' => ['چنیوٹ', 'chiniot']],
    ['canonical' => 'میانوالی', 'aliases' => ['میانوالی', 'mianwali']],
    ['canonical' => 'بھکر', 'aliases' => ['بھکر', 'bhakkar']],
    ['canonical' => 'لودھراں', 'aliases' => ['لودھراں', 'lodhran']],
    ['canonical' => 'حیدرآباد', 'aliases' => ['حیدرآباد', 'hyderabad']],
    ['canonical' => 'نوشہرہ ورکاں', 'aliases' => ['نوشہرہ ورکاں', 'نوشہروکرکا', 'nowshehra virkan']],
    ['canonical' => 'ننکانہ صاحب', 'aliases' => ['ننکانہ صاحب', 'ننکانہ', 'nankana sahib', 'nankana']],
    ['canonical' => 'شاہ کوٹ', 'aliases' => ['شاہ کوٹ', 'شاہکوٹ', 'shahkot']],
    ['canonical' => 'فروز وٹواں', 'aliases' => ['فروز وٹواں', 'فروزوٹواں', 'feroze watwan']],
    ['canonical' => 'باغ چوک', 'aliases' => ['باغ چوک', 'باغچوک', 'bagh chowk']],
    ['canonical' => 'بیگ پور', 'aliases' => ['بیگ پور', 'بیگپور', 'baig pur']],
    ['canonical' => 'جوئیاں والے موڑ', 'aliases' => ['جوئیاں والے موڑ', 'جوئیاں والا موڑ', 'جوئیاں والے', 'joyanwala mor']],
    ['canonical' => 'وہاڑی', 'aliases' => ['وہاڑی', 'vehari']],
    ['canonical' => 'پتوکی', 'aliases' => ['پتوکی', 'pattoki']],
    ['canonical' => 'بورے والا', 'aliases' => ['بورے والا', 'burewala']],
    ['canonical' => 'حافظ آباد', 'aliases' => ['حافظ آباد', 'hafizabad']],
    ['canonical' => 'مظفر گڑھ', 'aliases' => ['مظفر گڑھ', 'muzaffargarh']],
    ['canonical' => 'فاروق آباد', 'aliases' => ['فاروق آباد', 'farooqabad']]
];

$fromCity = '';
$toCity = '';

// Check Route pairs (City A تا City B)
foreach ($CITY_DICT as $c1) {
    foreach ($CITY_DICT as $c2) {
        if ($c1['canonical'] === $c2['canonical']) continue;
        foreach ($c1['aliases'] as $a1) {
            foreach ($c2['aliases'] as $a2) {
                if (preg_match('/' . preg_quote($a1, '/') . '\s*(?:تا|سے|to|-|➔|->)\s*' . preg_quote($a2, '/') . '/ui', $rawText)) {
                    $fromCity = $c1['canonical'];
                    $toCity = $c2['canonical'];
                    break 4;
                }
            }
        }
    }
}

// Fallback search
if (!$fromCity || !$toCity) {
    $matched = [];
    foreach ($CITY_DICT as $c) {
        foreach ($c['aliases'] as $alias) {
            if (mb_stripos($rawText, $alias) !== false) {
                if (!in_array($c['canonical'], $matched)) {
                    $matched[] = $c['canonical'];
                }
                break;
            }
        }
    }
    if (count($matched) >= 2) {
        $fromCity = $matched[0];
        $toCity = $matched[1];
    } elseif (count($matched) === 1) {
        $fromCity = $matched[0];
    }
}

if (!$fromCity && !$toCity) {
    echo json_encode([
        'success' => false,
        'ignored' => true,
        'reason' => 'عام چیٹ نظر انداز کر دی گئی ہے (کوئی روانگی یا منزل کا شہر نہیں ملا)۔',
        'replies' => []
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// -----------------------------------------------------------------
// 5. PARSE WEIGHT, VEHICLE, GOODS & ADDA
// -----------------------------------------------------------------
$detectedWeight = '';
if (preg_match('/(\d+(?:\/\d+)?[\.\d]*\s*(?:ٹن|ton|tons|ٹنز|kg|کیلو))/ui', $rawText, $wMatch)) {
    $detectedWeight = trim($wMatch[1]);
}

$detectedQty = '';
if (preg_match('/(\d+\s*(?:گاڑیوں\s*کا\s*مال|گاڑیاں|بوریاں|تھیلے|کارٹن|کاٹن|پیکٹ|بوری|ڈرم))/ui', $rawText, $qMatch)) {
    $detectedQty = trim($qMatch[1]);
}

$detectedVehicle = '22 Wheeler';
if (preg_match('/اوپن\s*ٹریلر|trailer|ٹریلر/ui', $rawText)) $detectedVehicle = 'اوپن ٹریلر';
elseif (preg_match('/22\s*(?:وہیلر|wheeler)/ui', $rawText)) $detectedVehicle = '22 Wheeler';
elseif (preg_match('/10\s*(?:وہیلر|wheeler)/ui', $rawText)) $detectedVehicle = '10 Wheeler';
elseif (preg_match('/شہزور|shahzor/ui', $rawText)) $detectedVehicle = 'Shahzor';
elseif (preg_match('/مزدا|mazda/ui', $rawText)) $detectedVehicle = 'Mazda';
elseif (preg_match('/40\s*(?:فٹ|foot)/ui', $rawText)) $detectedVehicle = '40 Foot Container';
elseif (preg_match('/16\s*(?:فٹ|foot)/ui', $rawText)) $detectedVehicle = '16 Foot';

$detectedBody = 'اوپن';
if (preg_match('/ہاف\s*باڈی/ui', $rawText)) $detectedBody = 'ہاف باڈی';
elseif (preg_match('/فل\s*باڈی/ui', $rawText)) $detectedBody = 'فل باڈی';
elseif (preg_match('/پھٹا/ui', $rawText)) $detectedBody = 'پھٹا';
elseif (preg_match('/کنٹینر|container/ui', $rawText)) $detectedBody = 'کنٹینر';

$detectedGoods = 'حاضر مال / جنرل کارگو';
if (preg_match('/(?:مال|سامان|goods|آئٹم)[\s:—\-]+([^\n,،\r]+)/ui', $rawText, $gMatch)) {
    $detectedGoods = trim($gMatch[1]);
} else {
    $COMMON_ITEMS = ['گندم', 'چاول', 'چینی', 'مکئی', 'کھاد', 'سریا', 'سیمنٹ', 'کاٹن', 'صابن', 'گھی', 'تیل', 'آلو', 'پیاز', 'میوہ', 'حاضر مال'];
    foreach ($COMMON_ITEMS as $item) {
        if (mb_stripos($rawText, $item) !== false) {
            $detectedGoods = $item;
            break;
        }
    }
}

$contactPerson = '';
if (preg_match('/(?:رابطہ|نام|contact|name)[\s:—\-]+([^\d\n,،\r/]+)/ui', $rawText, $nMatch)) {
    $cand = trim($nMatch[1]);
    if (mb_strlen($cand) >= 3 && mb_strlen($cand) <= 30) {
        $contactPerson = $cand;
    }
}

$detectedAdda = '';
$lines = explode("\n", $rawText);
foreach ($lines as $line) {
    $trimmed = trim(preg_replace('/^[🏢🚚📦📍📞*\s_—\-]+/u', '', $line));
    if (preg_match('/کارگو|گڈز|ٹرانسپورٹ|اڈا/ui', $trimmed)) {
        $detectedAdda = mb_substr($trimmed, 0, 50);
        break;
    }
}

$slipId = 'PKCL' . date('Ymd') . rand(1000, 9999);

$namedContacts = [];
if (!empty($detectedPhone)) {
    $namedContacts[] = ['name' => $contactPerson ?: 'منیجر / بکنگ انچارج', 'number' => $detectedPhone];
}
foreach ($additionalPhones as $idx => $p) {
    $namedContacts[] = ['name' => 'رابطہ نمبر ' . ($idx + 2), 'number' => $p];
}

$newSlip = [
    'id' => $slipId,
    'addaId' => 'wa_' . round(microtime(true) * 1000),
    'addaName' => $detectedAdda ?: (!empty($body['groupName']) ? $body['groupName'] : 'آل پاکستان ٹرانسپورٹ اڈا'),
    'addaCity' => $fromCity ?: 'پنجاب',
    'addaAddress' => ($fromCity ?: 'پنجاب') . '، پاکستان',
    'managerName' => $contactPerson ?: (!empty($body['sender']) ? $body['sender'] : 'واٹس ایپ ایڈمن'),
    'primaryPhone' => $detectedPhone ?: '03000000000',
    'whatsappNumber' => $detectedPhone ?: '03000000000',
    'additionalContacts' => $additionalPhones,
    'namedContacts' => $namedContacts,
    'loadingCity' => $fromCity ?: 'نامعلوم روانگی مقام',
    'loadingLocation' => $fromCity ?: 'لوڈنگ پوائنٹ',
    'destinationCity' => $toCity ?: 'نامعلوم منزل',
    'destinationLocation' => $toCity ?: 'ان لوڈنگ پوائنٹ',
    'goods' => $detectedGoods,
    'weight' => $detectedWeight ?: '15/20 ٹن',
    'quantity' => $detectedQty ?: 'حاضر مال',
    'vehicleType' => $detectedVehicle,
    'bodyType' => $detectedBody,
    'specialInstructions' => 'واٹس ایپ گروپ سے خودکار موصول شدہ: ' . mb_substr($rawText, 0, 120) . '...',
    'status' => 'active',
    'viewsCount' => 0,
    'sharesCount' => 0,
    'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
];

// Save to persistent file
$existingSlips = readAllSlips();
array_unshift($existingSlips, $newSlip);
writeAllSlips($existingSlips);

// Return pure JSON. replies: [] ensures AutoResponder stays completely SILENT in WhatsApp group!
echo json_encode([
    'success' => true,
    'message' => 'لوڈ سلپ کامیابی سے ویب سائٹ پر لائیو کر دی گئی ہے (واٹس ایپ گروپ میں کوئی واپسی میسج نہیں بھیجا جائے گا)۔',
    'silentMode' => true,
    'replies' => [],
    'slip' => $newSlip
], JSON_UNESCAPED_UNICODE);
