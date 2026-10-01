import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// File-based persistence for load slips and Adda profiles
const DATA_DIR = path.resolve(process.cwd(), 'data');
const SLIPS_FILE = path.join(DATA_DIR, 'slips.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic Pakistani transport load slips
const INITIAL_SERVER_SLIPS = [
  {
    id: 'PKCL-20261001-000125',
    addaId: 'adda_multan_01',
    addaName: 'نیو پنجاب کارگو گڈز اڈا',
    addaCity: 'ملتان',
    addaAddress: 'وہاڑی چوک، نزد نیو سبزی منڈی، ملتان',
    addaLogo: '/adda-logo.png',
    managerName: 'ملک عمران ظفر',
    primaryPhone: '0300-7312345',
    whatsappNumber: '0300-7312345',
    additionalContacts: ['0301-8654321', '0321-9876543'],
    loadingCity: 'ملتان',
    loadingLocation: 'شیر شاہ بائی پاس',
    destinationCity: 'لاہور',
    destinationLocation: 'بادامی باغ گڈز مارکیٹ',
    goods: 'کرنل باسمتی چاول',
    weight: '30 ٹن',
    quantity: '600 بوریاں (50 کلو)',
    vehicleType: '22 Wheeler',
    bodyType: 'فل باڈی',
    vehicleNumber: 'LEA-4890',
    fareOffer: 'مارکیٹ ریٹ / 1,45,000 روپے',
    specialInstructions: 'ترپال لازمی ہے۔ مال فوری لوڈ ہے۔ کیش پیشگی۔',
    status: 'active',
    createdAt: new Date().toISOString(),
    viewsCount: 42,
    sharesCount: 18,
  },
  {
    id: 'PKCL-20261001-000126',
    addaId: 'adda_multan_01',
    addaName: 'نیو پنجاب کارگو گڈز اڈا',
    addaCity: 'ملتان',
    addaAddress: 'وہاڑی چوک، نزد نیو سبزی منڈی، ملتان',
    addaLogo: '/adda-logo.png',
    managerName: 'ملک عمران ظفر',
    primaryPhone: '0300-7312345',
    whatsappNumber: '0300-7312345',
    additionalContacts: ['0301-8654321'],
    loadingCity: 'کراچی',
    loadingLocation: 'پورٹ قاسم، ٹرمینل 2',
    destinationCity: 'فیصل آباد',
    destinationLocation: 'جھنگ روڈ انڈسٹریل ایریا',
    goods: 'درآمدی کیمیکل ڈرم',
    weight: '25 ٹن',
    quantity: '120 ڈرم',
    vehicleType: '10 Wheeler',
    bodyType: 'فل باڈی',
    fareOffer: '1,90,000 روپے کیش',
    specialInstructions: 'کیمیکل مال، ڈرائیور کے پاس لائسنس ضروری ہے۔',
    status: 'active',
    createdAt: new Date().toISOString(),
    viewsCount: 68,
    sharesCount: 25,
  }
];

function getStoredSlips(): any[] {
  try {
    if (fs.existsSync(SLIPS_FILE)) {
      const data = fs.readFileSync(SLIPS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading slips file', err);
  }
  fs.writeFileSync(SLIPS_FILE, JSON.stringify(INITIAL_SERVER_SLIPS, null, 2));
  return INITIAL_SERVER_SLIPS;
}

function saveStoredSlips(slips: any[]) {
  try {
    fs.writeFileSync(SLIPS_FILE, JSON.stringify(slips, null, 2));
  } catch (err) {
    console.error('Error saving slips', err);
  }
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------
app.get('/api/slips', (_req: Request, res: Response) => {
  res.json(getStoredSlips());
});

app.post('/api/slips', (req: Request, res: Response) => {
  const newSlip = req.body;
  if (!newSlip || !newSlip.id) {
    res.status(400).json({ error: 'Invalid slip data' });
    return;
  }
  const slips = getStoredSlips();
  const existingIdx = slips.findIndex((s) => s.id === newSlip.id);
  if (existingIdx !== -1) {
    slips[existingIdx] = newSlip;
  } else {
    slips.unshift(newSlip);
  }
  saveStoredSlips(slips);
  res.json({ success: true, slip: newSlip });
});

app.get('/api/slips/:id', (req: Request, res: Response) => {
  const slips = getStoredSlips();
  const slip = slips.find((s) => s.id.toLowerCase() === req.params.id.toLowerCase());
  if (!slip) {
    res.status(404).json({ error: 'Slip not found' });
    return;
  }
  res.json(slip);
});

/**
 * Dynamic Preview Image Generator for WhatsApp Link Previews
 * "note preview image har ada ki apni hogi"
 * Generates or serves a customized 600x600 PNG image for the specific Adda and slip.
 */
app.get('/api/slip-og-image/:id', async (req: Request, res: Response) => {
  try {
    const slipId = req.params.id;
    const slips = getStoredSlips();
    const slip = slips.find((s) => s.id.toLowerCase() === slipId.toLowerCase()) || slips[0];

    // If the Adda uploaded a custom data URL or image file
    if (slip?.addaLogo && slip.addaLogo.startsWith('data:image/')) {
      const parts = slip.addaLogo.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const buffer = Buffer.from(parts[1], 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
      return;
    }

    const addaName = slip?.addaName || 'نیو پنجاب کارگو گڈز اڈا';
    const city = slip?.addaCity || 'پاکستان';
    const route = slip ? `${slip.loadingCity} ➔ ${slip.destinationCity}` : 'پاکستان کارگو لوڈز';
    const cargo = slip ? `${slip.goods} (${slip.weight})` : 'دستیاب لوڈ';
    const vehicle = slip?.vehicleType || '22 Wheeler';

    // Generate high-resolution 600x600 card for WhatsApp preview
    const svgCard = `
    <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0B2545"/>
          <stop offset="100%" stop-color="#07192F"/>
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="600" height="600" rx="40" fill="url(#bgGrad)"/>
      <rect x="20" y="20" width="560" height="560" rx="30" fill="none" stroke="#16A34A" stroke-width="8"/>

      <!-- Top Header Ribbon -->
      <path d="M40 50 L560 50 L540 100 L60 100 Z" fill="#16A34A"/>
      <text x="300" y="85" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#FFFFFF" text-anchor="middle">
        ★ مصدقہ گڈز ٹرانسپورٹ اڈا ★
      </text>

      <!-- Adda Name in Massive Bold Text -->
      <text x="300" y="165" font-family="Arial, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle">
        ${addaName}
      </text>
      <text x="300" y="205" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#34D399" text-anchor="middle">
        اڈا مقام: ${city} | رجسٹرڈ ٹرانسپورٹ اڈا
      </text>

      <!-- White Inner Cargo Card -->
      <rect x="50" y="235" width="500" height="240" rx="20" fill="#FFFFFF"/>

      <!-- Route Header -->
      <rect x="50" y="235" width="500" height="60" rx="20" fill="#0B2545"/>
      <text x="300" y="275" font-family="Arial, sans-serif" font-weight="900" font-size="26" fill="#FBBF24" text-anchor="middle">
        روٹ: ${route}
      </text>

      <!-- Cargo & Vehicle details -->
      <text x="300" y="340" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="#0B2545" text-anchor="middle">
        مال: ${cargo}
      </text>
      <text x="300" y="385" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#16A34A" text-anchor="middle">
        مطلوبہ گاڑی: ${vehicle} (${slip?.bodyType || 'فل باڈی'})
      </text>
      <text x="300" y="430" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#64748B" text-anchor="middle">
        Slip ID: ${slip?.id || 'PKCL-OFFICIAL'}
      </text>

      <!-- Footer Brand -->
      <text x="300" y="520" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#FFFFFF" text-anchor="middle">
        PK Cargo Link — پاکستان لوڈ سلپ سسٹم
      </text>
      <text x="300" y="550" font-family="Arial, sans-serif" font-weight="normal" font-size="16" fill="#94A3B8" text-anchor="middle">
        pkcargolink.com
      </text>
    </svg>
    `;

    const pngBuffer = await sharp(Buffer.from(svgCard)).png().toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(pngBuffer);
  } catch (err) {
    console.error('Error generating preview image', err);
    res.redirect('/adda-logo.png');
  }
});

// -------------------------------------------------------------
// Serve public assets (e.g. /adda-logo.png, /fonts, etc.)
// -------------------------------------------------------------
app.use(express.static(path.resolve(process.cwd(), 'public')));

// -------------------------------------------------------------
// Intercept /slip/:id to inject Open Graph meta tags for WhatsApp
// -------------------------------------------------------------
app.get('/slip/:id', (req: Request, res: Response, next) => {
  const slipId = req.params.id;
  const slips = getStoredSlips();
  const slip = slips.find((s) => s.id.toLowerCase() === slipId.toLowerCase()) || slips[0];

  const host = req.get('host') || 'pkcargolink.com';
  const proto = req.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;

  const indexPath = isProd 
    ? path.resolve(process.cwd(), 'dist/index.html')
    : path.resolve(process.cwd(), 'index.html');

  if (!fs.existsSync(indexPath)) {
    return next();
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  if (slip) {
    const ogTitle = `${slip.addaName} – دستیاب لوڈ: ${slip.loadingCity} تا ${slip.destinationCity}`;
    const ogDesc = `مال: ${slip.goods} (${slip.weight}) | مطلوبہ گاڑی: ${slip.vehicleType} | اڈا: ${slip.addaName} (${slip.addaCity}) | رابطہ: ${slip.primaryPhone}`;
    const siteUrl = 'https://pkcargolink.com';
    const ogImage = `${siteUrl}/api/slip-og-image/${slip.id}`;

    // Inject dynamic OpenGraph tags into HTML head
    const ogTags = `
    <!-- Dynamic Open Graph for WhatsApp & Social Media Preview -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${slip.addaName}" />
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:secure_url" content="${ogImage}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta property="og:url" content="${siteUrl}/slip/${slip.id}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDesc}" />
    <meta name="twitter:image" content="${ogImage}" />
    <title>${ogTitle}</title>
    `;

    html = html.replace('</head>', `${ogTags}\n</head>`);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// -------------------------------------------------------------
// Vite Middlewares (Dev) or Static files (Prod)
// -------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PK Cargo Link server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
