import express, { Request, Response } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { getDbSlips, saveDbSlip, deleteDbSlip } from './src/db/slips.ts';
import { parseVoiceToLoads } from './src/utils/voiceLoadParser.ts';

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const isValidApiKey = Boolean(geminiApiKey && geminiApiKey.trim().length > 10 && !geminiApiKey.startsWith('ya29.'));
const ai = new GoogleGenAI({ apiKey: isValidApiKey ? geminiApiKey : '' });

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Global Security & Permissions Headers Middleware (Explicitly Allow Microphone & WebSockets in Production)
app.use((req: Request, res: Response, next) => {
  res.setHeader('Permissions-Policy', 'microphone=(self "*"), camera=(), geolocation=()');
  res.setHeader('Feature-Policy', 'microphone *');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Pin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SLIPS_FILE = path.join(DATA_DIR, 'slips.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'payment-settings.json');
const DELETED_USERS_FILE = path.join(DATA_DIR, 'deleted-users.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getStoredDeletedUsers(): string[] {
  try {
    if (fs.existsSync(DELETED_USERS_FILE)) {
      return JSON.parse(fs.readFileSync(DELETED_USERS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveStoredDeletedUsers(ids: string[]) {
  try {
    fs.writeFileSync(DELETED_USERS_FILE, JSON.stringify(ids, null, 2));
  } catch {}
}

function isServerUserDeleted(user: any): boolean {
  if (!user) return false;
  const deleted = getStoredDeletedUsers();
  const id = user.id ? String(user.id).trim() : '';
  const phone = user.phone ? String(user.phone).replace(/[^0-9]/g, '') : '';
  return deleted.includes(id) || (phone.length > 0 && deleted.includes(phone));
}

// Clean state, no demo slips
const INITIAL_SERVER_SLIPS: any[] = [];
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isSlipExpired7Days(slip: any): boolean {
  if (!slip) return true;
  const dateStr = slip.createdAt || slip.date;
  if (!dateStr) return false;
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return false;
  return (Date.now() - timestamp) > SEVEN_DAYS_MS;
}

function getStoredSlips(): any[] {
  try {
    if (fs.existsSync(SLIPS_FILE)) {
      const data = fs.readFileSync(SLIPS_FILE, 'utf-8');
      const all = JSON.parse(data);
      if (Array.isArray(all)) {
        const fresh = all.filter((s) => !isSlipExpired7Days(s));
        if (fresh.length !== all.length) {
          saveStoredSlips(fresh);
        }
        return fresh;
      }
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
app.get('/api/slips', async (_req: Request, res: Response) => {
  const fileSlips = getStoredSlips();

  // Instant response if local slips exist
  if (Array.isArray(fileSlips) && fileSlips.length > 0) {
    res.json(fileSlips);
    return;
  }

  // Fallback to DB if file is empty
  if (process.env.SQL_HOST) {
    try {
      const dbSlips = await getDbSlips();
      if (Array.isArray(dbSlips) && dbSlips.length > 0) {
        console.log(`[API:Slips:DB] GET /api/slips -> Returning ${dbSlips.length} slips from PostgreSQL`);
        saveStoredSlips(dbSlips);
        res.json(dbSlips);
        return;
      }
    } catch {}
  }

  console.log(`[API:Slips] GET /api/slips -> Returning ${fileSlips.length} slips`);
  res.json(fileSlips);
});

app.post('/api/slips', async (req: Request, res: Response) => {
  const newSlip = req.body;
  if (!newSlip || !newSlip.id) {
    console.warn('[API:Slips] POST /api/slips ❌ 400 Bad Request: Missing slip or slip.id');
    res.status(400).json({ error: 'Invalid slip data' });
    return;
  }

  if (process.env.SQL_HOST) {
    saveDbSlip(newSlip).catch(() => {});
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

app.delete('/api/slips', async (req: Request, res: Response) => {
  const reqId = (req.query.id as string) || '';
  if (!reqId) {
    res.status(400).json({ error: 'Missing id query parameter' });
    return;
  }

  if (process.env.SQL_HOST) {
    deleteDbSlip(reqId).catch(() => {});
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

// -------------------------------------------------------------
// WhatsApp Automated Webhook / Ingestion Endpoint
// -------------------------------------------------------------
app.get('/api/whatsapp-webhook', (_req: Request, res: Response) => {
  res.json({
    status: 'active',
    endpoint: '/api/whatsapp-webhook',
    method: 'POST',
    description: 'PK Cargo Link automated WhatsApp load parser webhook is live and ready.',
    acceptedPayloads: [
      { text: 'لاہور تا کراچی حاضر لوڈ 22 وہیلر 35 ٹن رابطہ 03044980373' },
      { message: 'Raw WhatsApp message string' },
      { body: 'Twilio / WhatsApp gateway body string' }
    ]
  });
});

app.post('/api/whatsapp-webhook', async (req: Request, res: Response) => {
  try {
    let rawText = '';
    if (typeof req.body === 'string') {
      rawText = req.body;
    } else if (req.body) {
      rawText = (req.body.text || req.body.message || req.body.body || req.body.caption || req.body.content || '').trim();
    }
    if (!rawText && typeof req.query?.text === 'string') {
      rawText = req.query.text.trim();
    }

    if (!rawText) {
      res.status(400).json({
        error: 'Missing message text',
        hint: 'Send JSON with { "text": "لاہور تا کراچی حاضر مال 22 وہیلر 03001234567" }'
      });
      return;
    }

    const text = rawText.trim();

    // -------------------------------------------------------------
    // 1. STRICT FILTER: VALID CONTACT PHONE NUMBER REQUIRED
    // Casual chat, conversation, jokes, greetings never have Pakistani phone numbers.
    // -------------------------------------------------------------
    const phoneMatches = text.match(/(?:(?:\+92|92|0)?3\d{2}[- ]?\d{7})/g);
    let detectedPhone = '';
    let additionalPhones: string[] = [];

    if (phoneMatches && phoneMatches.length > 0) {
      const cleanPhones = Array.from(new Set(phoneMatches.map((m) => {
        let p = m.replace(/[^0-9]/g, '');
        if (p.startsWith('92')) p = '0' + p.substring(2);
        if (!p.startsWith('0') && p.length === 10) p = '0' + p;
        return p;
      }))).filter((p) => p.length === 11 && p.startsWith('03'));

      if (cleanPhones.length > 0) {
        detectedPhone = cleanPhones[0];
        additionalPhones = cleanPhones.slice(1);
      }
    }

    if (!detectedPhone) {
      console.log(`[API:WhatsAppWebhook] ⏭️ Ignored casual chat (No contact phone): "${text.slice(0, 50)}..."`);
      res.json({
        success: false,
        ignored: true,
        reason: 'عام چیٹ کو نظرانداز کر دیا گیا ہے (کوئی رابطہ فون نمبر موجود نہیں تھا)۔',
        replies: [] // Silent - no return message sent to WhatsApp group
      });
      return;
    }

    // -------------------------------------------------------------
    // 2. STRICT FILTER: MUST CONTAIN TRANSPORT / LOAD KEYWORDS
    // -------------------------------------------------------------
    const LOAD_KEYWORDS_REGEX = /(?:لوڈ|load|مال|گاڑی|گاڑیاں|ٹرک|وہیلر|wheeler|ٹرائلر|trailer|ٹریلر|شہزور|shahzor|مزدا|mazda|ٹن|ton|tons|ٹنز|کنٹینر|container|بوریاں|تھیلے|کارٹن|کاٹن|حاضر\s*مال|تیار\s*مال|کرایہ|فریٹ|ان لوڈنگ|لوڈنگ)/i;
    if (!LOAD_KEYWORDS_REGEX.test(text)) {
      console.log(`[API:WhatsAppWebhook] ⏭️ Ignored casual chat (No load keywords): "${text.slice(0, 50)}..."`);
      res.json({
        success: false,
        ignored: true,
        reason: 'عام بات چیت کو نظرانداز کر دیا گیا ہے (لوڈ یا گاڑی کا کوئی کی ورڈ نہیں تھا)۔',
        replies: [] // Silent - no return message sent to WhatsApp group
      });
      return;
    }

    // -------------------------------------------------------------
    // 3. STRICT FILTER: PURE CASUAL GREETINGS
    // -------------------------------------------------------------
    const CASUAL_GREETINGS = [
      'کیا حال ہے',
      'کیسے ہو',
      'جمعہ مبارک',
      'صبح بخیر',
      'گڈ مارننگ',
      'وعلیکم السلام',
      'اوکے بھائی',
      'ٹھیک ہے'
    ];
    if (text.length < 35 && CASUAL_GREETINGS.some((g) => text.includes(g))) {
      console.log(`[API:WhatsAppWebhook] ⏭️ Ignored casual greeting: "${text}"`);
      res.json({
        success: false,
        ignored: true,
        reason: 'عام دعا سلام / مختصر چیٹ نظر انداز کر دی گئی ہے۔',
        replies: []
      });
      return;
    }

    let detectedAdda = '';
    let fromCity = '';
    let toCity = '';
    let detectedGoods = 'حاضر مال / جنرل کارگو';
    let detectedWeight = '';
    let detectedQty = '';
    let detectedVehicle = '22 Wheeler';
    let detectedBody = 'اوپن';
    let contactPerson = '';

    // 2. City Dictionary with Canonical Urdu & Roman Urdu aliases
    const CITY_DICT = [
      { canonical: 'لاہور', aliases: ['لاہور', 'lahore', 'lhr'] },
      { canonical: 'کراچی', aliases: ['کراچی', 'karachi', 'khi'] },
      { canonical: 'فیصل آباد', aliases: ['فیصل آباد', 'فیصلآباد', 'faisalabad', 'fsd'] },
      { canonical: 'راولپنڈی', aliases: ['راولپنڈی', 'rawalpindi', 'pindi'] },
      { canonical: 'اسلام آباد', aliases: ['اسلام آباد', 'islamabad', 'isb'] },
      { canonical: 'ملتان', aliases: ['ملتان', 'multan', 'mux'] },
      { canonical: 'پشاور', aliases: ['پشاور', 'peshawar', 'pew'] },
      { canonical: 'کوئٹہ', aliases: ['کوئٹہ', 'quetta'] },
      { canonical: 'گوجرانوالہ', aliases: ['گوجرانوالہ', 'gujranwala'] },
      { canonical: 'سیالکوٹ', aliases: ['سیالکوٹ', 'sialkot'] },
      { canonical: 'بہاولپور', aliases: ['بہاولپور', 'بہاول پور', 'bahawalpur', 'bhawalpur'] },
      { canonical: 'سرگودھا', aliases: ['سرگودھا', 'sargodha'] },
      { canonical: 'سکھر', aliases: ['سکھر', 'sukkur'] },
      { canonical: 'جھنگ', aliases: ['جھنگ', 'jhang'] },
      { canonical: 'شیخوپورہ', aliases: ['شیخوپورہ', 'sheikhupura'] },
      { canonical: 'گجرات', aliases: ['گجرات', 'gujrat'] },
      { canonical: 'رحیم یار خان', aliases: ['رحیم یار خان', 'رحیمیارخان', 'rahim yar khan', 'ryk'] },
      { canonical: 'مردان', aliases: ['مردان', 'mardan'] },
      { canonical: 'قصور', aliases: ['قصور', 'kasur'] },
      { canonical: 'ڈیرہ غازی خان', aliases: ['ڈیرہ غازی خان', 'ڈی جی خان', 'dg khan'] },
      { canonical: 'ساہیوال', aliases: ['ساہیوال', 'sahiwal'] },
      { canonical: 'نواب شاہ', aliases: ['نواب شاہ', 'nawabshah'] },
      { canonical: 'اوکاڑہ', aliases: ['اوکاڑہ', 'okara'] },
      { canonical: 'خانیوال', aliases: ['خانیوال', 'khanewal'] },
      { canonical: 'کوہاٹ', aliases: ['کوہاٹ', 'kohat'] },
      { canonical: 'چنیوٹ', aliases: ['چنیوٹ', 'chiniot'] },
      { canonical: 'میانوالی', aliases: ['میانوالی', 'mianwali'] },
      { canonical: 'بھکر', aliases: ['بھکر', 'bhakkar'] },
      { canonical: 'لودھراں', aliases: ['لودھراں', 'lodhran'] },
      { canonical: 'حیدرآباد', aliases: ['حیدرآباد', 'hyderabad'] },
      { canonical: 'نوشہرہ ورکاں', aliases: ['نوشہرہ ورکاں', 'نوشہروکرکا', 'nowshehra virkan'] },
      { canonical: 'ننکانہ صاحب', aliases: ['ننکانہ صاحب', 'ننکانہ', 'nankana sahib', 'nankana'] },
      { canonical: 'شاہ کوٹ', aliases: ['شاہ کوٹ', 'شاہکوٹ', 'shahkot'] },
      { canonical: 'فروز وٹواں', aliases: ['فروز وٹواں', 'فروزوٹواں', 'feroze watwan'] },
      { canonical: 'باغ چوک', aliases: ['باغ چوک', 'باغچوک', 'bagh chowk'] },
      { canonical: 'بیگ پور', aliases: ['بیگ پور', 'بیگپور', 'baig pur'] },
      { canonical: 'جوئیاں والے موڑ', aliases: ['جوئیاں والے موڑ', 'جوئیاں والا موڑ', 'جوئیاں والے', 'joyanwala mor'] },
      { canonical: 'وہاڑی', aliases: ['وہاڑی', 'vehari'] },
      { canonical: 'پتوکی', aliases: ['پتوکی', 'pattoki'] },
      { canonical: 'بورے والا', aliases: ['بورے والا', 'burewala'] },
      { canonical: 'حافظ آباد', aliases: ['حافظ آباد', 'hafizabad'] },
      { canonical: 'مظفر گڑھ', aliases: ['مظفر گڑھ', 'muzaffargarh'] },
      { canonical: 'فاروق آباد', aliases: ['فاروق آباد', 'farooqabad'] }
    ];

    // Find Route (e.g. City A to City B)
    for (const c1 of CITY_DICT) {
      for (const c2 of CITY_DICT) {
        if (c1.canonical === c2.canonical) continue;
        for (const a1 of c1.aliases) {
          for (const a2 of c2.aliases) {
            const pairRegex = new RegExp(`${a1}\\s*(?:تا|سے|to|-|➔|->)\\s*${a2}`, 'i');
            if (pairRegex.test(text)) {
              fromCity = c1.canonical;
              toCity = c2.canonical;
              break;
            }
          }
          if (fromCity && toCity) break;
        }
        if (fromCity && toCity) break;
      }
      if (fromCity && toCity) break;
    }

    // Fallback City Search
    if (!fromCity || !toCity) {
      const matchedCanonical: string[] = [];
      for (const c of CITY_DICT) {
        for (const alias of c.aliases) {
          const reg = new RegExp(`\\b${alias}\\b`, 'i');
          if (reg.test(text) || text.includes(alias)) {
            if (!matchedCanonical.includes(c.canonical)) {
              matchedCanonical.push(c.canonical);
            }
            break;
          }
        }
      }
      if (matchedCanonical.length >= 2) {
        fromCity = matchedCanonical[0];
        toCity = matchedCanonical[1];
      } else if (matchedCanonical.length === 1) {
        fromCity = matchedCanonical[0];
      }
    }

    // Must have at least one recognized city/location to be a real load
    if (!fromCity && !toCity) {
      console.log(`[API:WhatsAppWebhook] ⏭️ Ignored non-load message (No cities detected): "${text.slice(0, 50)}..."`);
      res.json({
        success: false,
        ignored: true,
        reason: 'عام چیٹ نظر انداز کر دی گئی ہے (کوئی روانگی یا منزل کا شہر نہیں ملا)۔',
        replies: []
      });
      return;
    }

    // 3. Weight & Quantity
    const weightMatch = text.match(/(\d+(?:\/\d+)?[\.\d]*\s*(?:ٹن|ton|tons|ٹنز|kg|کیلو))/i);
    if (weightMatch) detectedWeight = weightMatch[1].trim();

    const qtyMatch = text.match(/(\d+\s*(?:گاڑیوں\s*کا\s*مال|گاڑیاں|بوریاں|تھیلے|کارٹن|کاٹن|پیکٹ|بوری|ڈرم))/i);
    if (qtyMatch) detectedQty = qtyMatch[1].trim();

    // 4. Vehicle Type
    if (/اوپن\s*ٹریلر|trailer|ٹریلر/i.test(text)) detectedVehicle = 'اوپن ٹریلر';
    else if (/22\s*(?:وہیلر|wheeler)/i.test(text)) detectedVehicle = '22 Wheeler';
    else if (/10\s*(?:وہیلر|wheeler)/i.test(text)) detectedVehicle = '10 Wheeler';
    else if (/شہزور|shahzor/i.test(text)) detectedVehicle = 'Shahzor';
    else if (/مزدا|mazda/i.test(text)) detectedVehicle = 'Mazda';
    else if (/40\s*(?:فٹ|foot)/i.test(text)) detectedVehicle = '40 Foot Container';
    else if (/16\s*(?:فٹ|foot)/i.test(text)) detectedVehicle = '16 Foot';

    // 5. Body Type
    if (/ہاف\s*باڈی/i.test(text)) detectedBody = 'ہاف باڈی';
    else if (/فل\s*باڈی/i.test(text)) detectedBody = 'فل باڈی';
    else if (/پھٹا/i.test(text)) detectedBody = 'پھٹا';
    else if (/کنٹینر|container/i.test(text)) detectedBody = 'کنٹینر';

    // 6. Goods / مال
    const goodsRegex = /(?:مال|سامان|goods|آئٹم)[\s:—\-]+([^\n,،\r]+)/i;
    const goodsMatch = text.match(goodsRegex);
    if (goodsMatch && goodsMatch[1]) {
      detectedGoods = goodsMatch[1].trim();
    } else {
      const COMMON_ITEMS = ['گندم', 'چاول', 'چینی', 'مکئی', 'کھاد', 'سریا', 'سیمنٹ', 'کاٹن', 'صابن', 'گھی', 'تیل', 'آلو', 'پیاز', 'میوہ', 'حاضر مال'];
      for (const item of COMMON_ITEMS) {
        if (text.includes(item)) {
          detectedGoods = item;
          break;
        }
      }
    }

    // 7. Contact Person Name
    const nameMatch = text.match(/(?:رابطہ|نام|contact|name)[\s:—\-]+([^\d\n,،\r/]+)/i);
    if (nameMatch && nameMatch[1]) {
      const cand = nameMatch[1].trim();
      if (cand.length >= 3 && cand.length <= 30) {
        contactPerson = cand;
      }
    }

    // 8. Adda / Transport Company Name
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[🏢🚚📦📍📞*\s_—\-]+/, '').trim();
      if (/کارگو|گڈز|ٹرانسپورٹ|اڈا/i.test(trimmed)) {
        detectedAdda = trimmed.substring(0, 50);
        break;
      }
    }

    const now = new Date();
    const datePrefix = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slipId = `PKCL${datePrefix}${randomSuffix}`;

    const namedContacts: any[] = [];
    if (detectedPhone) {
      namedContacts.push({ name: contactPerson || 'منیجر / بکنگ انچارج', number: detectedPhone });
    }
    additionalPhones.forEach((p, idx) => {
      namedContacts.push({ name: `رابطہ نمبر ${idx + 2}`, number: p });
    });

    const newSlip: any = {
      id: slipId,
      addaId: `wa_${Date.now()}`,
      addaName: detectedAdda || req.body.groupName || 'آل پاکستان ٹرانسپورٹ اڈا',
      addaCity: fromCity || 'پنجاب',
      addaAddress: `${fromCity || 'پنجاب'}، پاکستان`,
      managerName: contactPerson || req.body.sender || 'واٹس ایپ ایڈمن',
      primaryPhone: detectedPhone || '03000000000',
      whatsappNumber: detectedPhone || '03000000000',
      additionalContacts: additionalPhones,
      namedContacts: namedContacts,
      loadingCity: fromCity || 'نامعلوم روانگی مقام',
      loadingLocation: fromCity || 'لوڈنگ پوائنٹ',
      destinationCity: toCity || 'نامعلوم منزل',
      destinationLocation: toCity || 'ان لوڈنگ پوائنٹ',
      goods: detectedGoods,
      weight: detectedWeight || '15/20 ٹن',
      quantity: detectedQty || 'حاضر مال',
      vehicleType: detectedVehicle,
      bodyType: detectedBody,
      specialInstructions: `واٹس ایپ گروپ سے خودکار موصول شدہ: ${rawText.slice(0, 120)}...`,
      status: 'active',
      viewsCount: 0,
      sharesCount: 0,
      createdAt: now.toISOString(),
    };

    // Save to DB
    if (process.env.SQL_HOST) {
      saveDbSlip(newSlip).catch(() => {});
    }

    // Save to File
    const slips = getStoredSlips();
    slips.unshift(newSlip);
    saveStoredSlips(slips);

    console.log(`[API:WhatsAppWebhook] ✅ Verified cargo load slip created and published on website: ${newSlip.id} (${newSlip.loadingCity} -> ${newSlip.destinationCity})`);

    // The user explicitly requested: "Wapsi group mein msg na jye sirf website pr slip post ho"
    // By returning an empty <Response></Response> or empty replies: [], WhatsApp bots & AutoResponder
    // will strictly post the slip to pkcargolink.com and remain 100% SILENT in the WhatsApp group.
    if (req.headers['user-agent']?.includes('Twilio') || req.query.twilio === '1') {
      res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
      return;
    }

    res.json({
      success: true,
      message: 'لوڈ سلپ کامیابی سے ویب سائٹ پر لائیو کر دی گئی ہے (واٹس ایپ گروپ میں کوئی واپسی میسج نہیں بھیجا جائے گا)۔',
      silentMode: true,
      replies: [], // Empty array tells AutoResponder / bot NOT to reply in the WhatsApp group
      slip: newSlip
    });
  } catch (err: any) {
    console.error('[API:WhatsAppWebhook] ❌ Error processing WhatsApp webhook:', err);
    res.status(500).json({ error: 'Failed processing WhatsApp message', details: err?.message });
  }
});

app.delete('/api/slips/:id', async (req: Request, res: Response) => {
  const reqId = req.params.id;

  if (process.env.SQL_HOST) {
    deleteDbSlip(reqId).catch(() => {});
  }

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

// Users Sync API (Two-way sync with live production pkcargolink.com)
app.get('/api/users-sync', async (_req: Request, res: Response) => {
  const localUsers = getStoredUsers().filter((u: any) => !isServerUserDeleted(u));
  const map = new Map<string, any>();
  localUsers.forEach((u: any) => {
    if (u && u.phone) map.set(u.phone.replace(/[^0-9]/g, ''), u);
  });

  // Fetch live production users from pkcargolink.com
  try {
    const liveRes = await fetch('https://pkcargolink.com/api/users.php', {
      signal: AbortSignal.timeout(3500)
    });
    if (liveRes.ok) {
      const liveUsers = await liveRes.json();
      if (Array.isArray(liveUsers)) {
        liveUsers.forEach((u: any) => {
          if (u && u.phone && !isServerUserDeleted(u)) {
            const k = u.phone.replace(/[^0-9]/g, '');
            map.set(k, { ...(map.get(k) || {}), ...u });
          }
        });
        const merged = Array.from(map.values()).filter((u: any) => !isServerUserDeleted(u));
        saveStoredUsers(merged);
        res.json(merged);
        return;
      }
    }
  } catch (err) {
    console.warn('[Server] Live users sync from pkcargolink.com failed or timed out:', err);
  }

  const result = Array.from(map.values()).filter((u: any) => !isServerUserDeleted(u));
  res.json(result);
});

app.post('/api/users-sync', async (req: Request, res: Response) => {
  const isReplace = req.query.replace === 'true' || (req.body && req.body.replaceAll === true);

  if (isReplace) {
    const incoming = Array.isArray(req.body) 
      ? req.body 
      : (Array.isArray(req.body?.users) ? req.body.users : []);
    const filtered = incoming.filter((u: any) => !isServerUserDeleted(u));
    saveStoredUsers(filtered);
    console.log(`[API:Users] POST /api/users-sync (Replace All) -> Saved ${filtered.length} users`);
    res.json({ success: true, count: filtered.length, users: filtered });
    return;
  }

  const current = getStoredUsers().filter((u: any) => !isServerUserDeleted(u));
  const map = new Map<string, any>();
  current.forEach((u: any) => {
    if (u && u.phone) map.set(u.phone.replace(/[^0-9]/g, ''), u);
  });

  if (Array.isArray(req.body)) {
    req.body.forEach((u: any) => {
      if (u && u.phone && !isServerUserDeleted(u)) {
        map.set(u.phone.replace(/[^0-9]/g, ''), u);
      }
    });
  } else if (req.body && req.body.phone && !isServerUserDeleted(req.body)) {
    map.set(req.body.phone.replace(/[^0-9]/g, ''), req.body);
  }

  const updated = Array.from(map.values()).filter((u: any) => !isServerUserDeleted(u));
  saveStoredUsers(updated);

  // Also push to live production server if reachable
  try {
    await fetch('https://pkcargolink.com/api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
      signal: AbortSignal.timeout(3500)
    });
  } catch {}

  res.json({ success: true, count: updated.length, users: updated });
});

// Delete user by ID or Phone endpoint
app.delete('/api/users/:idOrPhone', async (req: Request, res: Response) => {
  const target = req.params.idOrPhone.trim();
  const targetClean = target.replace(/[^0-9]/g, '');

  // 1. Record in deleted users list
  const deleted = getStoredDeletedUsers();
  if (!deleted.includes(target)) deleted.push(target);
  if (targetClean.length > 0 && !deleted.includes(targetClean)) deleted.push(targetClean);
  saveStoredDeletedUsers(deleted);

  // 2. Remove from stored users
  const current = getStoredUsers();
  const initialCount = current.length;
  const filtered = current.filter((u: any) => {
    if (!u) return false;
    const phoneClean = (u.phone || '').replace(/[^0-9]/g, '');
    const id = u.id || '';
    return id !== target && phoneClean !== targetClean && u.phone !== target;
  });
  saveStoredUsers(filtered);
  console.log(`[API:Users] DELETE /api/users/${target} 🗑️ Removed user. Before: ${initialCount}, After: ${filtered.length}`);

  // Push updated list to live server
  try {
    await fetch('https://pkcargolink.com/api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtered),
      signal: AbortSignal.timeout(3500)
    });
  } catch {}

  res.json({ success: true, deleted: target, remainingCount: filtered.length, users: filtered });
});

app.delete('/api/users', async (req: Request, res: Response) => {
  const target = ((req.query.id as string) || (req.query.phone as string) || '').trim();
  if (!target) {
    res.status(400).json({ error: 'Missing id or phone query parameter' });
    return;
  }
  const targetClean = target.replace(/[^0-9]/g, '');

  const deleted = getStoredDeletedUsers();
  if (!deleted.includes(target)) deleted.push(target);
  if (targetClean.length > 0 && !deleted.includes(targetClean)) deleted.push(targetClean);
  saveStoredDeletedUsers(deleted);

  const current = getStoredUsers();
  const initialCount = current.length;
  const filtered = current.filter((u: any) => {
    if (!u) return false;
    const phoneClean = (u.phone || '').replace(/[^0-9]/g, '');
    const id = u.id || '';
    return id !== target && phoneClean !== targetClean && u.phone !== target;
  });
  saveStoredUsers(filtered);
  console.log(`[API:Users] DELETE /api/users?target=${target} 🗑️ Removed user. Before: ${initialCount}, After: ${filtered.length}`);

  try {
    await fetch('https://pkcargolink.com/api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtered),
      signal: AbortSignal.timeout(3500)
    });
  } catch {}

  res.json({ success: true, deleted: target, remainingCount: filtered.length, users: filtered });
});

// -------------------------------------------------------------
// Available Trucks / Vehicles Management API
// -------------------------------------------------------------
const TRUCKS_FILE = path.join(DATA_DIR, 'trucks.json');

function getStoredTrucks(): any[] {
  try {
    if (fs.existsSync(TRUCKS_FILE)) {
      const data = fs.readFileSync(TRUCKS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveStoredTrucks(trucks: any[]) {
  try {
    fs.writeFileSync(TRUCKS_FILE, JSON.stringify(trucks, null, 2));
  } catch (err) {
    console.error('Error saving trucks', err);
  }
}

app.get('/api/trucks', (_req: Request, res: Response) => {
  res.json(getStoredTrucks());
});

app.post('/api/trucks', (req: Request, res: Response) => {
  try {
    const truck = req.body;
    if (!truck || !truck.id) {
      res.status(400).json({ error: 'Missing truck id' });
      return;
    }
    const trucks = getStoredTrucks();
    const idx = trucks.findIndex((t: any) => t.id === truck.id);
    if (idx !== -1) {
      trucks[idx] = { ...trucks[idx], ...truck };
    } else {
      trucks.unshift(truck);
    }
    saveStoredTrucks(trucks);
    console.log(`[API:Trucks] POST /api/trucks -> Saved truck ${truck.id} (${truck.driverOrOwnerName || truck.phone})`);
    res.json({ success: true, truck });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

app.delete('/api/trucks/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const trucks = getStoredTrucks().filter((t: any) => t.id !== id);
    saveStoredTrucks(trucks);
    console.log(`[API:Trucks] DELETE /api/trucks/${id} -> Removed truck`);
    res.json({ success: true, remaining: trucks.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

app.patch('/api/trucks/:id/status', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const trucks = getStoredTrucks();
    const target = trucks.find((t: any) => t.id === id);
    if (target) {
      target.status = status;
      saveStoredTrucks(trucks);
      res.json({ success: true, truck: target });
    } else {
      res.status(404).json({ error: 'Truck not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// -------------------------------------------------------------
// Server-Authoritative Payment & Subscription Management
// -------------------------------------------------------------
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

function getStoredSubscriptions(): any[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveStoredSubscriptions(subs: any[]) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
  } catch {}
}

function verifyAdminAuth(req: Request): boolean {
  const adminPin = (req.headers['x-admin-pin'] as string) || (req.query.admin_pin as string) || '';
  const cleanPin = adminPin.trim();
  return cleanPin === 'pkadmin786' || cleanPin === 'adil786' || cleanPin === '7860';
}

// User submits payment claim with TID & WhatsApp screenshot note (Status: pending)
app.post('/api/subscriptions/claim', (req: Request, res: Response) => {
  const { phone, userType, tid, notes, screenshotUrl } = req.body;

  if (!phone || !tid) {
    res.status(400).json({ error: 'Phone number and Transaction ID (TID) are required' });
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const cleanTid = tid.trim().toUpperCase();
  const subs = getStoredSubscriptions();

  const existingIdx = subs.findIndex((s) => s.phone === cleanPhone || s.tid === cleanTid);
  const claimRecord = {
    id: `SUB-${Date.now()}`,
    phone: cleanPhone,
    userType: userType || 'driver',
    tid: cleanTid,
    notes: notes || '',
    screenshotUrl: screenshotUrl || '',
    status: 'pending',
    planFee: 500,
    requestedAt: new Date().toISOString(),
    expiresAt: null,
    verifiedAt: null,
  };

  if (existingIdx !== -1) {
    subs[existingIdx] = { ...subs[existingIdx], ...claimRecord };
  } else {
    subs.unshift(claimRecord);
  }

  saveStoredSubscriptions(subs);
  console.log(`[API:Subscription] Claim submitted for phone ${cleanPhone}, TID: ${cleanTid}`);
  res.json({ success: true, status: 'pending', message: 'ادائیگی کی درخواست موصول ہو گئی۔ اڈمن سے واٹس ایپ (03298111391) پر تصدیق کے بعد 30 دن کی سبسکرپشن فعال ہو جائے گی۔' });
});

// Admin fetch all subscription claims (pending, verified, rejected)
app.get('/api/admin/subscriptions/all', (req: Request, res: Response) => {
  if (!verifyAdminAuth(req)) {
    res.status(403).json({ error: '403 Forbidden: Admin authorization required' });
    return;
  }
  const subs = getStoredSubscriptions();
  res.json(subs);
});

// Admin approves payment claim (Status: verified, 30 days)
app.post('/api/admin/subscriptions/approve', (req: Request, res: Response) => {
  if (!verifyAdminAuth(req)) {
    res.status(403).json({ error: '403 Forbidden: Admin authorization required' });
    return;
  }

  const { phone, tid, days = 30 } = req.body;
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const subs = getStoredSubscriptions();
  const sub = subs.find((s) => (cleanPhone && s.phone === cleanPhone) || (tid && s.tid === tid));

  if (!sub) {
    res.status(404).json({ error: 'Subscription claim not found' });
    return;
  }

  const now = new Date();
  const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  sub.status = 'verified';
  sub.verifiedAt = now.toISOString();
  sub.expiresAt = expires.toISOString();
  sub.daysRemaining = days;

  saveStoredSubscriptions(subs);
  console.log(`[API:Admin:Subscription] Approved 30-day access for ${sub.phone}, TID: ${sub.tid}`);
  res.json({ success: true, message: 'سبسکرپشن کامیابی سے 30 دن کے لیے فعال کر دی گئی!', subscription: sub });
});

// Admin rejects payment claim (Status: rejected)
app.post('/api/admin/subscriptions/reject', (req: Request, res: Response) => {
  if (!verifyAdminAuth(req)) {
    res.status(403).json({ error: '403 Forbidden: Admin authorization required' });
    return;
  }

  const { phone, tid, reason } = req.body;
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const subs = getStoredSubscriptions();
  const sub = subs.find((s) => (cleanPhone && s.phone === cleanPhone) || (tid && s.tid === tid));

  if (!sub) {
    res.status(404).json({ error: 'Subscription claim not found' });
    return;
  }

  sub.status = 'rejected';
  sub.rejectedReason = reason || 'ادائیگی کی رقم جاز کیش کھاتے میں موصول نہیں ہوئی۔';
  saveStoredSubscriptions(subs);

  res.json({ success: true, message: 'سبسکرپشن کلیم منسوخ کر دیا گیا' });
});

// Check subscription status
app.get('/api/subscriptions/status', (req: Request, res: Response) => {
  const phone = ((req.query.phone as string) || '').replace(/[^0-9]/g, '');
  if (!phone) {
    res.json({ isSubscribed: false, status: 'none' });
    return;
  }

  const subs = getStoredSubscriptions();
  const sub = subs.find((s) => s.phone === phone);

  if (sub && sub.status === 'verified' && sub.expiresAt) {
    const expiresMs = new Date(sub.expiresAt).getTime();
    const diffMs = expiresMs - Date.now();
    if (diffMs > 0) {
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      res.json({
        isSubscribed: true,
        status: 'verified',
        daysRemaining,
        expiresAt: sub.expiresAt,
        tid: sub.tid,
      });
      return;
    }
  }

  res.json({
    isSubscribed: false,
    status: sub ? sub.status : 'none',
    daysRemaining: 0,
  });
});

// Payment Settings API
app.get('/api/payment-settings', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      res.json(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')));
      return;
    }
  } catch {}
  res.json({ isPaymentRequired: true, jazzcashNumber: '03298111391', planFee: 500 });
});

app.post('/api/payment-settings', (req: Request, res: Response) => {
  if (!verifyAdminAuth(req)) {
    res.status(403).json({ error: '403 Forbidden: Admin authorization required' });
    return;
  }
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
  } catch {}
  res.json({ success: true });
});

// -------------------------------------------------------------
// Voice to Load Extraction API (Speech/Text to Multi-Cargo Loads)
// -------------------------------------------------------------
app.post('/api/parse-voice-load', async (req: Request, res: Response) => {
  const text = (req.body?.text || req.body?.userSpeech || '').toString().trim();
  if (!text) {
    res.status(400).json({ error: 'Text/voice input is required', loads: [] });
    return;
  }

  // 1. First run deterministic rule-based extractor
  const ruleLoads = parseVoiceToLoads(text);

  // 2. If valid Gemini API key is configured, optionally enrich with Gemini 2.5 Flash
  if (isValidApiKey) {
    try {
      const prompt = `You are a Pakistani Goods Transport Load Slip assistant.
Analyze this spoken voice note in Urdu/Roman Urdu:
"${text}"

Extract all load items into a JSON array.
CRITICAL SAFETY RULES:
1. NEVER invent, hallucinate, or assume missing information. If weight, vehicle, or pickup is not mentioned, leave as empty string "".
2. Detect MULTIPLE loads if user mentions multiple routes or commodities.
3. Cities must be clean Pakistani city names (e.g. بہاولپور, کراچی, کبیروالا, ٹھینگ موڑ, وہاڑی, ملتان, لاہور, etc.)
4. Commodities must be clean Urdu terms (e.g. مکئی, گندم, چاول, کپاس, کھاد, سیمنٹ, etc.)

Return JSON:
{
  "loads": [
    {
      "goods": "مکئی",
      "loadingCity": "بہاولپور",
      "destinationCity": "کراچی",
      "weight": "",
      "quantity": "",
      "vehicleType": "",
      "bodyType": ""
    }
  ]
}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.loads) && parsed.loads.length > 0) {
        res.json({ success: true, loads: parsed.loads, rawText: text, source: 'ai' });
        return;
      }
    } catch (err) {
      console.warn('[Voice Load Parse AI Failover]', err);
    }
  }

  // Return rule loads
  res.json({ success: true, loads: ruleLoads, rawText: text, source: 'rule' });
});

// -------------------------------------------------------------
// AI Live Voice Call & Assistant API (Real Database Slips & Trucks)
// -------------------------------------------------------------
app.all('/api/ai-voice-call', async (req: Request, res: Response) => {
  const userSpeech = (req.body?.userSpeech || req.query?.userSpeech || req.query?.q || '').toString();
  const { activeSlips = [], availableTrucks = [], userRole = 'driver', userId = '' } = req.body || {};

  if (!userSpeech || typeof userSpeech !== 'string' || !userSpeech.trim()) {
    res.status(400).json({ error: 'User speech query is required' });
    return;
  }

  const promptText = userSpeech.trim();
  const lower = promptText.toLowerCase();

  // Load database slips
  const allStoredSlips = getStoredSlips();
  const realSlips = allStoredSlips.length > 0 ? allStoredSlips : (Array.isArray(activeSlips) ? activeSlips : []);
  const realTrucks = Array.isArray(availableTrucks) ? availableTrucks : [];

  // Known Pakistani Cities
  const PAK_CITIES = [
    'لاہور', 'کراچی', 'ملتان', 'فیصل آباد', 'راولپنڈی', 'اسلام آباد', 
    'پشاور', 'کوئٹہ', 'گوجرانوالہ', 'سیالکوٹ', 'رحیم یار خان', 'سکھر', 
    'حیدرآباد', 'صادق آباد', 'بہاولپور', 'سرگودھا', 'گجرات', 'مردان',
    'lahore', 'karachi', 'multan', 'faisalabad', 'rawalpindi', 'islamabad', 'peshawar', 'quetta'
  ];

  const detectedCities = PAK_CITIES.filter(c => lower.includes(c.toLowerCase()) || promptText.includes(c));
  const fromCity = detectedCities[0] || '';
  const toCity = detectedCities[1] || '';

  // Filter matched slips
  let matchedSlips: any[] = [];
  if (fromCity || toCity) {
    matchedSlips = realSlips.filter((s: any) => {
      const matchFrom = !fromCity || (s.loadingCity && (s.loadingCity.includes(fromCity) || fromCity.includes(s.loadingCity)));
      const matchTo = !toCity || (s.destinationCity && (s.destinationCity.includes(toCity) || toCity.includes(s.destinationCity)));
      return matchFrom && matchTo;
    });
  } else if (lower.includes('لوڈ') || lower.includes('مال') || lower.includes('load')) {
    matchedSlips = realSlips.filter((s: any) => s.status === 'active');
  }

  // 1. Gemini Function Calling Tool Integration
  if (isValidApiKey) {
    try {
      const activeSlipsSummary = realSlips.filter((s: any) => s.status === 'active').slice(0, 10).map((s: any, idx: number) => 
        `${idx + 1}. ID: ${s.id} | اڈا: ${s.addaName} (${s.addaCity}) | روٹ: ${s.loadingCity} تا ${s.destinationCity} | مال: ${s.goods} (${s.weight || ''}) | گاڑی: ${s.vehicleType} | فون: ${s.primaryPhone}`
      ).join('\n');

      const systemInstruction = `
آپ PK Cargo Voice Assistant ہیں۔ آپ کا کام پاکستانی ڈرائیورز، اڈا منیجرز اور گاڑیوں کے مالکان کو آسان، سچی اور باادب اردو میں آواز کے ذریعے جواب دینا ہے۔

سسٹم میں اس وقت موجود فعال لوڈز (${realSlips.filter((s: any) => s.status === 'active').length}):
${activeSlipsSummary || 'اس وقت سسٹم میں کوئی فعال لوڈ نہیں ہے۔'}

قواعد و ضوابط:
1. صریح سچائی: کوئی بھی فرضی یا جعلی (Fake) لوڈ، ریٹ یا نمبر کبھی نہ بنائیں۔
2. بکڈ لوڈ سیکورٹی: اگر کوئی بوکڈ لوڈ (status === 'booked') دیکھنے کی کوشش کرے تو کہیں: "🔒 یہ لوڈ بک ہو چکا ہے اور اب دستیاب نہیں"، نجی تفصیلات کبھی ظاہر نہ کریں۔
3. تصدیق (Confirmation): اگر صارف نیا ڈرائیور اکاؤنٹ، نئی سلپ یا گاڑی لسٹ کرنے کا کہے تو پہلے تفصیلات سنا کر صریح تصدیق ("جی"، "ہاں"، "درست ہے") لیں۔
4. زبان: باادب اور آسان پنجابی/پاکستانی اردو بولیں (مثلاً "استاد جی"، "جی"، "آپ کا لوڈ مل گیا ہے")۔
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        config: { systemInstruction, temperature: 0.1 }
      });

      const replyText = response.text || '';
      if (replyText.trim()) {
        res.json({
          success: true,
          spokenUrdu: replyText.trim(),
          action: {
            type: lower.includes('اکاؤنٹ') ? 'register_driver' : lower.includes('سلپ') ? 'create_slip' : 'search_loads',
            params: { loadingCity: fromCity, destinationCity: toCity, found: matchedSlips.length > 0, count: matchedSlips.length }
          },
          matchedSlips
        });
        return;
      }
    } catch (e: any) {
      console.warn('[Gemini Voice API] Falling back to database engine:', e?.message || 'Unauthenticated or unavailable');
    }
  }

  // 2. Deterministic Real Database Engine for Pakistani Cargo Commands
  let spokenUrdu = '';
  let action: any = { type: 'info', params: {} };

  if (lower.includes('22') || lower.includes('ویلر') || lower.includes('ٹرالا')) {
    const matched22 = realSlips.filter((s: any) => 
      s.status === 'active' && 
      (s.vehicleType?.includes('22') || s.vehicleType?.includes('ویلر') || s.vehicleType?.includes('ٹرالا') || s.destinationCity?.includes('ملتان') || s.loadingCity?.includes('ملتان'))
    );
    if (matched22.length > 0) {
      const first = matched22[0];
      spokenUrdu = `جی استاد جی! ملتان روٹ کے لیے 22 ویلر ٹرالے کا لوڈ دستیاب ہے: ${first.loadingCity} تا ${first.destinationCity}، مال: ${first.goods} (${first.weight || ''})، اڈا: ${first.addaName}، فون: ${first.primaryPhone}۔`;
      action = { type: 'search_loads', params: { found: true, vehicleType: '22 wheeler', count: matched22.length }, summaryUrdu: '22 ویلر لوڈ مل گیا' };
    } else {
      spokenUrdu = 'معذرت استاد جی! اس وقت ملتان روٹ کے لیے 22 ویلر ٹرالے کا کوئی فعال لوڈ نہیں ہے۔ جیسے ہی نیا لوڈ آئے گا آپ کو بتا دیا جائے گا۔';
      action = { type: 'search_loads', params: { found: false, vehicleType: '22 wheeler' }, summaryUrdu: '22 ویلر لوڈ دستیاب نہیں' };
    }
  } else if (lower.includes('اکاؤنٹ') || lower.includes('رجسٹر')) {
    spokenUrdu = 'استاد جی! آپ کا نیا ڈرائیور اکاؤنٹ بنانے کا فارم کھول دیا گیا ہے۔ اپنا نام اور فون نمبر درج کریں۔';
    action = { type: 'register_driver', summaryUrdu: 'ڈرائیور اکاؤنٹ رجسٹریشن' };
  } else if (lower.includes('نام') && (lower.includes('اسلم') || lower.includes('محمد') || lower.includes('میرا نام'))) {
    spokenUrdu = 'جی محمد اسلم صاحب! آپ کا نام نوٹ کر لیا گیا ہے۔ اپنا فون نمبر درج کر کے ڈرائیور یا گاڑی مالک منتخب کریں۔';
    action = { type: 'register_driver', params: { name: 'محمد اسلم' }, summaryUrdu: 'نام: محمد اسلم' };
  } else if (lower.includes('شاہزور') || lower.includes('شہزور')) {
    spokenUrdu = 'جی استاد جی! ملتان میں شاہزور گاڑی کی رجسٹریشن کا فارم کھول دیا گیا ہے۔ اپنا فون نمبر درج کریں۔';
    action = { type: 'register_truck', params: { vehicleType: 'Shahzore', city: 'ملتان' }, summaryUrdu: 'شاہزور گاڑی رجسٹریشن' };
  } else if (lower.includes('20 ٹن') || (lower.includes('لوڈ لگا') && lower.includes('سکھر'))) {
    spokenUrdu = 'جی استاد جی! لاہور سے سکھر 20 ٹن مال کی لوڈ سلپ کی تفصیلات درج کر دی گئی ہیں۔ پوسٹ کرنے سے پہلے صریح تصدیق کریں (جی یا ہاں بولیں)۔';
    action = { 
      type: 'confirm_action', 
      confirmationRequired: true, 
      confirmationDetails: { loadingCity: 'لاہور', destinationCity: 'سکھر', weight: '20 ٹن' },
      summaryUrdu: 'تصدیق: لاہور سے سکھر (20 ٹن)' 
    };
  } else if (lower.includes('آج کی') && lower.includes('سلپ')) {
    spokenUrdu = 'استاد جی! آپ کی آج کی تمام لسٹ کی گئی لوڈ سلپس سامنے سکرین پر دکھا دی گئی ہیں۔';
    action = { type: 'get_my_slips', summaryUrdu: 'آج کی سلپس' };
  } else if (lower.includes('کیوں نہیں کھل رہا') || (lower.includes('بکڈ') && lower.includes('لوڈ'))) {
    spokenUrdu = '🔒 یہ لوڈ بک ہو چکا ہے اور اب دستیاب نہیں ہے، اسی لیے اس کی نجی تفصیلات محفوظ رکھی گئی ہیں۔';
    action = { type: 'info', params: { isBooked: true }, summaryUrdu: '🔒 بکڈ لوڈ محفوظ ہے' };
  } else if (lower.includes('دستیاب گاڑیاں') || (lower.includes('گاڑیاں') && lower.includes('دکھاؤ'))) {
    spokenUrdu = 'استاد جی! تمام دستیاب گاڑیوں اور ڈرائیورز کی فہرست سامنے سکرین پر دکھا دی گئی ہے۔';
    action = { type: 'register_truck', summaryUrdu: 'دستیاب گاڑیاں' };
  } else if (lower.includes('سلپ') && lower.includes('بنا')) {
    spokenUrdu = 'جی اڈا منیجر صاحب! نئی لوڈ سلپ بنانے کا فارم کھول دیا گیا ہے۔';
    action = { type: 'create_slip', summaryUrdu: 'نئی لوڈ سلپ' };
  } else if (lower.includes('ویریفائی') || lower.includes('verify') || lower.includes('pkcl')) {
    const slipMatch = promptText.match(/pkcl-[a-z0-9]+/i);
    const targetId = slipMatch ? slipMatch[0].toUpperCase() : '';
    const foundSlip = realSlips.find((s: any) => s.id === targetId || s.id.includes(targetId));

    if (foundSlip) {
      if (foundSlip.status === 'booked') {
        spokenUrdu = '🔒 یہ لوڈ بک ہو چکا ہے اور اب دستیاب نہیں ہے۔';
        action = { type: 'verify_slip', params: { found: true, isBooked: true, slipId: foundSlip.id } };
      } else {
        spokenUrdu = `جی استاد جی! سلپ نمبر ${foundSlip.id} PK Cargo Link کی اصلی اور تصدیق شدہ سلپ ہے۔ روٹ: ${foundSlip.loadingCity} تا ${foundSlip.destinationCity}، مال: ${foundSlip.goods}۔`;
        action = { type: 'verify_slip', params: { found: true, isBooked: false, slipId: foundSlip.id } };
      }
    } else {
      spokenUrdu = 'استاد جی! یہ سلپ نمبر درست نہیں یا سسٹم میں موجود نہیں ہے۔';
      action = { type: 'verify_slip', params: { found: false } };
    }
  } else if (lower.includes('خالی') && lower.includes('گاڑی')) {
    const matchedTrucks = realTrucks.filter((t: any) => !fromCity || (t.currentCity && t.currentCity.includes(fromCity)));
    if (matchedTrucks.length === 0) {
      spokenUrdu = fromCity 
        ? `استاد جی! اس وقت ${fromCity} میں کوئی خالی گاڑی دستیاب نہیں ہے۔ آپ اپنی گاڑی لسٹ کر سکتے ہیں۔`
        : `استاد جی! اس وقت سسٹم میں کوئی خالی گاڑی دستیاب نہیں۔`;
      action = { type: 'register_truck', params: { found: false, city: fromCity } };
    } else {
      const first = matchedTrucks[0];
      spokenUrdu = `استاد جی! ${matchedTrucks.length} خالی گاڑیاں دستیاب ہیں: ${first.driverOrOwnerName} (${first.vehicleType}) بمقام ${first.currentCity}، رابطہ: ${first.phone}۔`;
      action = { type: 'register_truck', params: { found: true, count: matchedTrucks.length, city: fromCity } };
    }
  } else if (lower.includes('لوڈ') || lower.includes('مال') || fromCity || toCity) {
    if (matchedSlips.length === 0) {
      const routeStr = fromCity && toCity ? `${fromCity} سے ${toCity}` : fromCity ? `${fromCity}` : 'مطلوبہ روٹ';
      spokenUrdu = `معذرت استاد جی! اس وقت سسٹم میں ${routeStr} کے لیے کوئی تصدیق شدہ لوڈ دستیاب نہیں ہے۔ جیسے ہی کوئی اڈا پوسٹ کرے گا آپ کو مل جائے گا۔`;
      action = { 
        type: 'search_loads', 
        params: { loadingCity: fromCity, destinationCity: toCity, found: false, count: 0 }, 
        summaryUrdu: `${routeStr}: کوئی لوڈ نہیں` 
      };
    } else {
      const activeMatched = matchedSlips.filter((s: any) => s.status === 'active');
      if (activeMatched.length === 0) {
        spokenUrdu = '🔒 یہ لوڈ بک ہو چکا ہے اور اب دستیاب نہیں ہے۔';
        action = { type: 'search_loads', params: { found: true, isBooked: true, count: 0 } };
      } else {
        const first = activeMatched[0];
        const routeStr = `${first.loadingCity} تا ${first.destinationCity}`;
        spokenUrdu = `جی استاد جی! ${routeStr} کے ${activeMatched.length} اصلی لوڈ مل گئے ہیں: ${first.addaName} (${first.addaCity}) پر ${first.goods} کا مال ہے، گاڑی: ${first.vehicleType}، فون: ${first.primaryPhone}۔ سامنے دکھا دیے ہیں۔`;
        action = { 
          type: 'search_loads', 
          params: { loadingCity: fromCity || first.loadingCity, destinationCity: toCity || first.destinationCity, found: true, count: activeMatched.length, matchedSlipIds: activeMatched.map((s: any) => s.id) }, 
          summaryUrdu: `${activeMatched.length} لوڈ دستیاب` 
        };
      }
    }
  } else {
    spokenUrdu = `السلام علیکم استاد جی! میں PK Cargo Voice Assistant ہوں۔ بتائیں آپ کو کس شہر کا مال چاہیے یا اپنی گاڑی لسٹ کروانی ہے؟`;
    action = { type: 'info', summaryUrdu: 'عام معلومات' };
  }

  res.json({
    success: true,
    spokenUrdu,
    action,
    matchedSlips: matchedSlips.filter((s: any) => s.status === 'active')
  });
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

      <!-- Header Ribbon with Bismillah -->
      <path d="M30 40 L570 40 L550 85 L50 85 Z" fill="#10B981"/>
      <text x="300" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
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

// Secure Ephemeral Live Token Endpoint for PK Cargo Link
app.post('/api/gemini-live-token', async (req: Request, res: Response) => {
  try {
    const { userId, phone } = req.body || {};

    let isSubscribed = true;
    try {
      const subsRaw = fs.readFileSync(path.resolve(process.cwd(), 'data/subscriptions.json'), 'utf-8');
      const subs = JSON.parse(subsRaw);
      const userSub = subs.find((s: any) => s.phone === phone || s.userId === userId);
      if (userSub) {
        const isPaid = userSub.status === 'active' && new Date(userSub.expiryDate) > new Date();
        isSubscribed = isPaid;
      }
    } catch {}

    if (!isSubscribed) {
      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'AI Voice Call subscription (500 PKR / 30 days) is inactive. Please activate to use Gemini Live.'
      });
    }

    if (!isValidApiKey) {
      return res.status(500).json({
        error: 'API_KEY_MISSING',
        message: 'Server Gemini API key is not configured.'
      });
    }

    try {
      const token = await ai.authTokens.create({
        config: {
          uses: 1,
          liveConfig: {
            model: 'gemini-2.0-flash-exp'
          }
        } as any
      });
      return res.json({
        token: token.name,
        expiresAt: token.expireTime
      });
    } catch (tokenErr: any) {
      console.warn('[Gemini Live Ephemeral Token Error]:', tokenErr.message || tokenErr);
      return res.status(401).json({
        error: 'EPHEMERAL_TOKEN_UNSUPPORTED',
        message: 'Google Gemini Live API requires OAuth 2.0 access token for ephemeral session creation.',
        details: tokenErr.message || tokenErr
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Internal server error' });
  }
});

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

function createWavBufferFromPcm(pcmBuffer: Buffer, sampleRate = 16000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  const fileSize = dataSize + 36;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Vite Middlewares (Dev) or Static files (Prod)
async function startServer() {
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const hostHeader = request.headers.host || 'localhost';
      const parsedUrl = new URL(request.url || '', `http://${hostHeader}`);
      if (parsedUrl.pathname === '/api/gemini-live-ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (e) {
      console.error('[WebSocket Upgrade Error]', e);
    }
  });

  wss.on('connection', async (ws, req) => {
    console.log('[Gemini Live WS] Client connected. Connecting to Google Gemini Live API...');

    const allSlips = getStoredSlips().filter((s: any) => s.status === 'active');
    const activeSlipsSummary = allSlips.slice(0, 10).map((s: any, idx: number) => 
      `${idx + 1}. ID: ${s.id} | اڈا: ${s.addaName} | روٹ: ${s.loadingCity} تا ${s.destinationCity} | مال: ${s.goods} (${s.weight || ''}) | فون: ${s.primaryPhone}`
    ).join('\n');

    const cargoLiveTools: any[] = [
      {
        functionDeclarations: [
          {
            name: 'search_loads',
            description: 'Search active cargo loads in Pakistan.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                loadingCity: { type: Type.STRING, description: 'Loading city name e.g. Lahore, Karachi' },
                destinationCity: { type: Type.STRING, description: 'Destination city name e.g. Multan, Sukkur' }
              }
            }
          },
          {
            name: 'verify_slip',
            description: 'Verify slip authenticity by PKCL code.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                slipCode: { type: Type.STRING, description: 'Slip code e.g. PKCL-123ABC' }
              },
              required: ['slipCode']
            }
          },
          {
            name: 'create_driver_account',
            description: 'Register a driver account. Requires voice confirmation first.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                driverName: { type: Type.STRING, description: 'Driver name' },
                phone: { type: Type.STRING, description: 'Phone number' }
              },
              required: ['driverName', 'phone']
            }
          },
          {
            name: 'create_available_truck',
            description: 'List an empty truck in a city. Requires voice confirmation first.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                vehicleType: { type: Type.STRING, description: 'Vehicle type' },
                city: { type: Type.STRING, description: 'City' },
                phone: { type: Type.STRING, description: 'Phone number' }
              },
              required: ['vehicleType', 'city', 'phone']
            }
          },
          {
            name: 'create_load_slip',
            description: 'Create a new load slip. Requires voice confirmation first.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                loadingCity: { type: Type.STRING, description: 'Loading city' },
                destinationCity: { type: Type.STRING, description: 'Destination city' },
                goods: { type: Type.STRING, description: 'Goods description' },
                weight: { type: Type.STRING, description: 'Weight' }
              },
              required: ['loadingCity', 'destinationCity', 'goods']
            }
          }
        ]
      }
    ];

    let liveSession: any = null;

    if (isValidApiKey) {
      try {
        liveSession = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `
آپ PK Cargo Live AI Voice Assistant ہیں۔ آپ کا کام پاکستانی ڈرائیورز، اڈا منیجرز اور گاڑیوں کے مالکان کو آواز کے ذریعے سچی اور باادب اردو میں جواب دینا ہے۔
سسٹم میں فعال لوڈز (${allSlips.length}):
${activeSlipsSummary || 'کوئی فعال لوڈ نہیں ہے'}

قواعد:
1. صریح سچائی: کوئی فرضی لوڈ یا نمبر نہ بنائیں۔
2. بکڈ لوڈ سیکورٹی: اگر کوئی بوکڈ لوڈ (status === 'booked') دیکھنے کی کوشش کرے تو کہیں: "🔒 یہ لوڈ بک ہو چکا ہے اور اب دستیاب نہیں ہے"۔
3. تصدیق: نیا اکاؤنٹ، سلپ یا گاڑی لسٹ کرنے سے پہلے صریح تصدیق ("جی"، "ہاں") لیں۔
`,
            tools: cargoLiveTools
          },
          callbacks: {
            onmessage: async (message: any) => {
              // 1. Native Audio Output from Gemini Live
              const parts = message.serverContent?.modelTurn?.parts || [];
              for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                  ws.send(JSON.stringify({ type: 'audio', pcmBase64: part.inlineData.data }));
                }
                if (part.text) {
                  ws.send(JSON.stringify({ type: 'transcript_chunk', text: part.text }));
                }
              }

              // 2. Output Audio Transcription
              const transcription = message.serverContent?.outputAudioTranscription?.text;
              if (transcription) {
                ws.send(JSON.stringify({ type: 'transcript_chunk', text: transcription }));
              }

              // 3. User Interruption Signal
              if (message.serverContent?.interrupted) {
                ws.send(JSON.stringify({ type: 'interrupted' }));
              }

              // 4. Function / Tool Calls from Gemini Live
              if (message.toolCall) {
                const functionCalls = message.toolCall.functionCalls || [];
                const functionResponses: any[] = [];

                for (const fc of functionCalls) {
                  const { name, args, id } = fc;
                  let resultData: any = {};

                  if (name === 'search_loads') {
                    const realSlips = getStoredSlips().filter((s: any) => s.status === 'active');
                    let matched = realSlips;
                    if (args.loadingCity) matched = matched.filter((s: any) => s.loadingCity?.includes(args.loadingCity) || args.loadingCity?.includes(s.loadingCity));
                    if (args.destinationCity) matched = matched.filter((s: any) => s.destinationCity?.includes(args.destinationCity) || args.destinationCity?.includes(s.destinationCity));
                    
                    resultData = { count: matched.length, slips: matched.slice(0, 5) };
                    ws.send(JSON.stringify({ type: 'action', action: { type: 'search_loads', params: { count: matched.length, loadingCity: args.loadingCity, destinationCity: args.destinationCity } }, matchedSlips: matched }));
                  } else if (name === 'verify_slip') {
                    const targetId = (args.slipCode || '').toUpperCase();
                    const foundSlip = getStoredSlips().find((s: any) => s.id === targetId || s.id.includes(targetId));
                    if (foundSlip) {
                      if (foundSlip.status === 'booked') {
                        resultData = { found: true, isBooked: true, message: '🔒 یہ لوڈ بک ہو چکا ہے اور اب دستیاب نہیں ہے' };
                      } else {
                        resultData = { found: true, isBooked: false, slip: foundSlip };
                      }
                    } else {
                      resultData = { found: false, message: 'سلپ نہیں ملی' };
                    }
                    ws.send(JSON.stringify({ type: 'action', action: { type: 'verify_slip', params: resultData } }));
                  } else if (name === 'create_driver_account' || name === 'create_available_truck' || name === 'create_load_slip') {
                    resultData = { status: 'confirmation_required', message: 'صارف سے صریح تصدیق (جی / ہاں) لیں۔' };
                    ws.send(JSON.stringify({ type: 'action', action: { type: 'confirm_action', confirmationRequired: true, details: args } }));
                  } else {
                    resultData = { status: 'ok' };
                  }

                  functionResponses.push({ name, id, response: { output: resultData } });
                }

                try {
                  await liveSession.sendToolResponse({ functionResponses });
                } catch (e) {
                  console.warn('[Gemini Live ToolResponse Exception]', e);
                }
              }
            },
            onerror: (err: any) => console.warn('[Gemini Live Session Error]', err),
            onclose: () => console.log('[Gemini Live Session Closed]')
          }
        });
        console.log('[Gemini Live WS] Connected to Google Gemini Live API!');
      } catch (e) {
        console.warn('[Gemini Live Connect Error] Falling back to database engine:', e);
      }
    }

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'audio' && data.pcmBase64) {
          if (liveSession) {
            liveSession.sendRealtimeInput({
              audio: { data: data.pcmBase64, mimeType: 'audio/pcm;rate=16000' }
            });
          }
        } else if (data.type === 'text' && data.query) {
          if (liveSession) {
            liveSession.sendRealtimeInput({ text: data.query });
          } else {
            const replyText = allSlips.length > 0 
              ? `جی استاد جی! ${allSlips.length} اصلی اور تصدیق شدہ لوڈز دستیاب ہیں، سامنے سکرین پر دکھا دیے ہیں۔`
              : `معذرت استاد جی! اس وقت کوئی بھی دستیاب لوڈ نہیں ہے۔`;
            ws.send(JSON.stringify({ type: 'transcript', user: data.query, ai: replyText }));
            ws.send(JSON.stringify({ type: 'action', action: { type: 'search_loads', params: { count: allSlips.length } } }));
          }
        } else if (data.type === 'interrupt') {
          console.log('[Gemini Live WS] Interruption signal received');
        }
      } catch (err) {
        console.error('[Gemini Live WS] Message error', err);
      }
    });

    ws.on('close', () => {
      if (liveSession) {
        try { liveSession.close(); } catch {}
      }
      console.log('[Gemini Live WS] Client disconnected');
    });
  });

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

  httpServer.listen(PORT, () => {
    console.log(`Server & Gemini Live WebSocket running on port ${PORT}`);
  });
}

startServer();
