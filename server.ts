import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SLIPS_FILE = path.join(DATA_DIR, 'slips.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'payment-settings.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Clean state, no demo slips
const INITIAL_SERVER_SLIPS: any[] = [];

function getStoredSlips(): any[] {
  try {
    if (fs.existsSync(SLIPS_FILE)) {
      const data = fs.readFileSync(SLIPS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading slips file', err);
  }
  return INITIAL_SERVER_SLIPS;
}

function saveStoredSlips(slips: any[]) {
  try {
    fs.writeFileSync(SLIPS_FILE, JSON.stringify(slips, null, 2));
  } catch (err) {
    console.error('Error saving slips', err);
  }
}

function getStoredUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveStoredUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch {}
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------
app.get('/api/slips', (_req: Request, res: Response) => {
  const slips = getStoredSlips();
  console.log(`[API:Slips] GET /api/slips -> Returning ${slips.length} slips`);
  res.json(slips);
});

app.post('/api/slips', (req: Request, res: Response) => {
  const newSlip = req.body;
  if (!newSlip || !newSlip.id) {
    console.warn('[API:Slips] POST /api/slips ❌ 400 Bad Request: Missing slip or slip.id');
    res.status(400).json({ error: 'Invalid slip data' });
    return;
  }
  const slips = getStoredSlips();
  const cleanNewId = newSlip.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const existingIdx = slips.findIndex((s) => {
    const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return s.id === newSlip.id || sClean === cleanNewId;
  });
  if (existingIdx !== -1) {
    slips[existingIdx] = newSlip;
    console.log(`[API:Slips] POST /api/slips 🔄 Updated existing slip: ${newSlip.id}`);
  } else {
    slips.unshift(newSlip);
    console.log(`[API:Slips] POST /api/slips ➕ Inserted new slip: ${newSlip.id}`);
  }
  saveStoredSlips(slips);
  res.json({ success: true, slip: newSlip });
});

app.delete('/api/slips', (req: Request, res: Response) => {
  const reqId = (req.query.id as string) || '';
  if (!reqId) {
    res.status(400).json({ error: 'Missing id query parameter' });
    return;
  }
  const cleanId = reqId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const initialCount = getStoredSlips().length;
  const slips = getStoredSlips().filter((s) => {
    const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return s.id !== reqId && sClean !== cleanId;
  });
  saveStoredSlips(slips);
  console.log(`[API:Slips] DELETE /api/slips?id=${reqId} 🗑️ Removed. Before: ${initialCount}, After: ${slips.length}`);
  res.json({ success: true, deleted: reqId, remainingCount: slips.length });
});

app.delete('/api/slips/:id', (req: Request, res: Response) => {
  const reqId = req.params.id;
  const cleanId = reqId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const initialCount = getStoredSlips().length;
  const slips = getStoredSlips().filter((s) => {
    const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return s.id !== reqId && sClean !== cleanId;
  });
  saveStoredSlips(slips);
  console.log(`[API:Slips] DELETE /api/slips/${reqId} 🗑️ Removed. Before: ${initialCount}, After: ${slips.length}`);
  res.json({ success: true, deleted: reqId, remainingCount: slips.length });
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

// Users Sync API
app.get('/api/users-sync', (_req: Request, res: Response) => {
  res.json(getStoredUsers());
});

app.post('/api/users-sync', (req: Request, res: Response) => {
  const current = getStoredUsers();
  const map = new Map<string, any>();
  current.forEach((u: any) => {
    if (u.phone) map.set(u.phone.replace(/[^0-9]/g, ''), u);
  });

  if (Array.isArray(req.body)) {
    req.body.forEach((u: any) => {
      if (u && u.phone) {
        map.set(u.phone.replace(/[^0-9]/g, ''), u);
      }
    });
  } else if (req.body && req.body.phone) {
    map.set(req.body.phone.replace(/[^0-9]/g, ''), req.body);
  }

  const updated = Array.from(map.values());
  saveStoredUsers(updated);
  res.json({ success: true, count: updated.length, users: updated });
});

// Payment Settings API
app.get('/api/payment-settings', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      res.json(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')));
      return;
    }
  } catch {}
  res.json({ isPaymentRequired: false });
});

app.post('/api/payment-settings', (req: Request, res: Response) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
  } catch {}
  res.json({ success: true });
});

/**
 * Dynamic Preview Image Generator for WhatsApp Link Previews
 * Generates a unique 600x600 preview image for the specific Adda and slip.
 */
app.get('/api/slip-og-image/:id', async (req: Request, res: Response) => {
  try {
    const slipId = req.params.id;
    const slips = getStoredSlips();
    let slip = slips.find((s) => s.id.toLowerCase() === slipId.toLowerCase());

    const addaName = (req.query.a as string) || slip?.addaName || 'پاکستان کارگو گڈز اڈا';
    const city = (req.query.c as string) || slip?.addaCity || 'پاکستان';
    const fromCity = (req.query.from as string) || slip?.loadingCity || 'لوڈنگ مقام';
    const toCity = (req.query.to as string) || slip?.destinationCity || 'منزل';
    const cargo = (req.query.g as string) || slip?.goods || 'دستیاب لوڈ';
    const weight = (req.query.w as string) || slip?.weight || '';
    const vehicle = (req.query.v as string) || slip?.vehicleType || '22 Wheeler';

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

    const svgCard = `
    <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0B2545"/>
          <stop offset="100%" stop-color="#06182D"/>
        </linearGradient>
      </defs>

      <rect width="600" height="600" rx="30" fill="url(#bgGrad)"/>
      <rect x="15" y="15" width="570" height="570" rx="25" fill="none" stroke="#10B981" stroke-width="6"/>

      <!-- Header Ribbon -->
      <path d="M30 40 L570 40 L550 85 L50 85 Z" fill="#10B981"/>
      <text x="300" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">
        ★ مصدقہ گڈز ٹرانسپورٹ اڈا ★
      </text>

      <!-- Adda Name in Massive Bold Text -->
      <text x="300" y="145" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle">
        ${addaName}
      </text>
      <text x="300" y="180" font-family="Arial, sans-serif" font-weight="bold" font-size="18" fill="#34D399" text-anchor="middle">
        اڈا مقام: ${city} | تصدیق شدہ لوڈ
      </text>

      <!-- Inner White Card -->
      <rect x="40" y="210" width="520" height="270" rx="20" fill="#FFFFFF"/>

      <!-- Route Header -->
      <rect x="40" y="210" width="520" height="65" rx="20" fill="#0B2545"/>
      <text x="300" y="252" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#FBBF24" text-anchor="middle">
        ${fromCity} ➔ ${toCity}
      </text>

      <!-- Cargo Details -->
      <text x="520" y="320" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#0B2545" text-anchor="end">
        مال: ${cargo} ${weight ? `(${weight})` : ''}
      </text>

      <text x="520" y="370" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#047857" text-anchor="end">
        گاڑی: ${vehicle}
      </text>

      <text x="520" y="420" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#1E293B" text-anchor="end">
        سلپ نمبر: ${slipId}
      </text>

      <!-- Footer Button -->
      <rect x="80" y="505" width="440" height="60" rx="15" fill="#10B981"/>
      <text x="300" y="542" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">
        مکمل لوڈ سلپ اور رابطہ دیکھنے کے لیے کلک کریں
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

// Serve public assets
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Intercept /slip/:id to inject Open Graph meta tags for WhatsApp
app.get('/slip/:id', (req: Request, res: Response, next) => {
  const slipId = req.params.id;
  const slips = getStoredSlips();
  const cleanReqId = slipId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  let slip = slips.find((s) => {
    const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return s.id.toLowerCase() === slipId.toLowerCase() || (cleanReqId.length > 3 && sClean === cleanReqId);
  });
  if (!slip && slips.length > 0) {
    slip = slips[0];
  }

  // Prioritize query parameters
  const queryAdda = req.query.a as string;
  const queryFrom = req.query.from as string;
  const queryTo = req.query.to as string;
  const queryGoods = req.query.g as string;
  const queryWeight = req.query.w as string;
  const queryVehicle = req.query.v as string;
  const queryPhone = req.query.p as string;

  const addaName = queryAdda || slip?.addaName || 'کارگو گڈز اڈا';
  const loadingCity = queryFrom || slip?.loadingCity || 'لوڈنگ مقام';
  const destinationCity = queryTo || slip?.destinationCity || 'منزل';
  const goods = queryGoods || slip?.goods || 'دستیاب مال';
  const weight = queryWeight || slip?.weight || '';
  const vehicle = queryVehicle || slip?.vehicleType || 'ٹرک';
  const phone = queryPhone || slip?.primaryPhone || 'اڈا فون';

  const siteUrl = 'https://pkcargolink.com';
  const ogTitle = `${addaName} – دستیاب لوڈ: ${loadingCity} تا ${destinationCity}`;
  const ogDesc = `مال: ${goods} ${weight ? `(${weight})` : ''} | مطلوبہ گاڑی: ${vehicle} | اڈا: ${addaName} | رابطہ: ${phone}`;
  let ogImage = `${siteUrl}/api/slip-og-image/${slipId}?a=${encodeURIComponent(addaName)}&from=${encodeURIComponent(loadingCity)}&to=${encodeURIComponent(destinationCity)}&g=${encodeURIComponent(goods)}&w=${encodeURIComponent(weight)}&v=${encodeURIComponent(vehicle)}`;
  if (slip?.addaLogo && slip.addaLogo.startsWith('http') && !slip.addaLogo.includes('adda-logo.png') && !slip.addaLogo.includes('icon-512.png')) {
    ogImage = slip.addaLogo;
  }

  const indexPath = isProd 
    ? path.resolve(process.cwd(), 'dist/index.html')
    : path.resolve(process.cwd(), 'index.html');

  if (!fs.existsSync(indexPath)) {
    return next();
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  // Strip default OG tags
  html = html.replace(/<meta\s+property="og:title"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:image"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:site_name"[^>]*>/gi, '');

  const ogTags = `
  <!-- Dynamic Open Graph for WhatsApp & Social Media Preview -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${addaName}" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDesc}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:secure_url" content="${ogImage}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="600" />
  <meta property="og:image:height" content="600" />
  <meta property="og:url" content="${siteUrl}/slip/${slipId}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDesc}" />
  <meta name="twitter:image" content="${ogImage}" />
  <title>${ogTitle}</title>
  `;

  html = html.replace('</head>', `${ogTags}\n</head>`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Vite Middlewares (Dev) or Static files (Prod)
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
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
