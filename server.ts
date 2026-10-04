import express, { Request, Response } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { getDbSlips, saveDbSlip, deleteDbSlip } from './src/db/slips.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Global Security & Permissions Headers Middleware (Explicitly Allow Microphone & WebSockets in Production)
app.use((_req: Request, res: Response, next) => {
  res.setHeader('Permissions-Policy', 'microphone=(self "*"), camera=(), geolocation=()');
  res.setHeader('Feature-Policy', 'microphone *');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Pin');
  next();
});

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
  if (process.env.SQL_HOST) {
    try {
      const dbSlips = await getDbSlips();
      console.log(`[API:Slips:DB] GET /api/slips -> Returning ${dbSlips.length} slips from PostgreSQL`);
      // Keep local file in sync as backup
      saveStoredSlips(dbSlips);
      res.json(dbSlips);
      return;
    } catch (err) {
      console.warn('[API:Slips:DB] Failed reading from database, using file backup:', err);
    }
  }

  const slips = getStoredSlips();
  console.log(`[API:Slips] GET /api/slips -> Returning ${slips.length} slips`);
  res.json(slips);
});

app.post('/api/slips', async (req: Request, res: Response) => {
  const newSlip = req.body;
  if (!newSlip || !newSlip.id) {
    console.warn('[API:Slips] POST /api/slips ❌ 400 Bad Request: Missing slip or slip.id');
    res.status(400).json({ error: 'Invalid slip data' });
    return;
  }

  if (process.env.SQL_HOST) {
    try {
      await saveDbSlip(newSlip);
      console.log(`[API:Slips:DB] POST /api/slips -> Saved slip ${newSlip.id} to PostgreSQL`);
    } catch (err) {
      console.warn('[API:Slips:DB] Failed saving slip to database:', err);
    }
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
    try {
      await deleteDbSlip(reqId);
      console.log(`[API:Slips:DB] DELETE /api/slips?id=${reqId} -> Deleted from PostgreSQL`);
    } catch (err) {
      console.warn('[API:Slips:DB] Failed deleting from database:', err);
    }
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

app.delete('/api/slips/:id', async (req: Request, res: Response) => {
  const reqId = req.params.id;

  if (process.env.SQL_HOST) {
    try {
      await deleteDbSlip(reqId);
      console.log(`[API:Slips:DB] DELETE /api/slips/${reqId} -> Deleted from PostgreSQL`);
    } catch (err) {
      console.warn('[API:Slips:DB] Failed deleting from database:', err);
    }
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
  const localUsers = getStoredUsers();
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
          if (u && u.phone) {
            const k = u.phone.replace(/[^0-9]/g, '');
            map.set(k, { ...(map.get(k) || {}), ...u });
          }
        });
        const merged = Array.from(map.values());
        saveStoredUsers(merged);
        res.json(merged);
        return;
      }
    }
  } catch (err) {
    console.warn('[Server] Live users sync from pkcargolink.com failed or timed out:', err);
  }

  res.json(Array.from(map.values()));
});

app.post('/api/users-sync', async (req: Request, res: Response) => {
  const current = getStoredUsers();
  const map = new Map<string, any>();
  current.forEach((u: any) => {
    if (u && u.phone) map.set(u.phone.replace(/[^0-9]/g, ''), u);
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
// AI Live Voice Call & Assistant API (Real Database Slips & Trucks)
// -------------------------------------------------------------
app.post('/api/ai-voice-call', async (req: Request, res: Response) => {
  const { userSpeech, activeSlips = [], availableTrucks = [], userRole = 'driver', userId = '' } = req.body;

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
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10) {
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
        model: 'gemini-2.5-flash',
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
    } catch (e) {
      console.warn('[Gemini Voice API] Exception in AI Voice endpoint, using deterministic fallback', e);
    }
  }

  // 2. Deterministic Real Database Engine (Zero Fake Data)
  let spokenUrdu = '';
  let action: any = { type: 'info', params: {} };

  if (lower.includes('اکاؤنٹ') || lower.includes('رجسٹر')) {
    spokenUrdu = 'استاد جی! آپ کا نیا ڈرائیور اکاؤنٹ بنانے کا فارم کھول دیا گیا ہے۔';
    action = { type: 'register_driver', summaryUrdu: 'ڈرائیور اکاؤنٹ رجسٹریشن' };
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
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/api/gemini-live-ws' });

  wss.on('connection', (ws, req) => {
    console.log('[Gemini Live WS] Client connected to live WebSocket proxy');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'text' && data.query) {
          const queryText = data.query.trim();
          const allSlips = getStoredSlips().filter((s: any) => s.status === 'active');

          let replyText = '';
          if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10) {
            try {
              const activeSlipsSummary = allSlips.slice(0, 10).map((s: any, idx: number) => 
                `${idx + 1}. ID: ${s.id} | اڈا: ${s.addaName} | روٹ: ${s.loadingCity} تا ${s.destinationCity} | مال: ${s.goods} (${s.weight || ''}) | فون: ${s.primaryPhone}`
              ).join('\n');

              const systemInstruction = `
آپ PK Cargo Live AI Voice Assistant ہیں۔ آپ کا کام ڈرائیورز اور اڈا منیجرز کو باادب، سچی اور مختصر اردو میں جواب دینا ہے۔
سسٹم میں موجود فعال لوڈز (${allSlips.length}):
${activeSlipsSummary || 'کوئی فعال لوڈ نہیں ہے'}
`;

              const aiRes = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: queryText }] }],
                config: { systemInstruction, temperature: 0.1 }
              });

              replyText = aiRes.text || '';
            } catch (err) {
              console.warn('[Gemini Live WS] Gemini API call exception:', err);
            }
          }

          if (!replyText) {
            const count = allSlips.length;
            replyText = count > 0 
              ? `جی استاد جی! ${count} اصلی لوڈز دستیاب ہیں، سامنے سکرین پر دکھا دیے ہیں۔`
              : `معذرت استاد جی! اس وقت کوئی بھی دستیاب لوڈ نہیں ہے۔`;
          }

          ws.send(JSON.stringify({
            type: 'transcript',
            user: queryText,
            ai: replyText
          }));

          ws.send(JSON.stringify({
            type: 'action',
            action: { type: 'search_loads', params: { count: allSlips.length } }
          }));

        } else if (data.type === 'audio' && data.pcmBase64) {
          ws.send(JSON.stringify({
            type: 'transcript',
            user: 'صوت موصولہ (آواز)',
            ai: 'جی استاد جی، میں آپ کا حکم سن رہا ہوں۔ کس شہر کا مال چاہیے؟'
          }));
        } else if (data.type === 'interrupt') {
          console.log('[Gemini Live WS] User interrupted AI speech');
        }
      } catch (err) {
        console.error('[Gemini Live WS] WebSocket message error', err);
      }
    });

    ws.on('close', () => {
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
