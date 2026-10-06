/**
 * WhatsApp chat-export importer — pure parsing logic (no UI).
 *
 * Takes a WhatsApp group chat export (.txt) and extracts:
 *  - LOAD postings  -> LoadSlip objects
 *  - VEHICLE postings -> AvailableTruck objects
 * Everything else is treated as chatter and skipped.
 *
 * Standing user rule (non-negotiable): a slip missing its pickup/loading
 * city OR its phone number is NEVER imported — it lands in `skipped`
 * with a reason instead.
 */
import { LoadSlip, AvailableTruck } from '../types';
import { mapToUrduCity, CITY_EN_TO_UR } from './location';
import { PAKISTAN_VEHICLE_TYPES } from './vehicleTypes';

export interface WaMessage {
  sender: string;
  text: string;
  date: string; // raw date part as seen in the export
  attachment?: string; // attached filename, if any
}

export interface SkippedItem {
  reason: string;
  text: string;
  sender?: string;
}

export interface ParsedImport {
  loads: LoadSlip[];
  vehicles: AvailableTruck[];
  skipped: SkippedItem[];
}

// ---------------------------------------------------------------------------
// 1. Export text -> messages
// ---------------------------------------------------------------------------

const LINE_PATTERNS: RegExp[] = [
  // [M/D/YY, H:MM:SS AM] Sender: message   (also 24h without AM/PM)
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s*([^:]+?):\s?(.*)$/,
  // DD/MM/YYYY, HH:MM - Sender: message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*-\s*([^:]+?):\s?(.*)$/,
];

const ATTACHMENT_RE = /(?:<attached:\s*([^>]+)>|\(([^)]*file attached[^)]*)\))/i;
const OMITTED_RE = /<?\s*(?:media|image|video|audio|document|sticker|gif)?\s*omitted\s*>?/i;

/** System lines that are never postings (joins, leaves, encryption notices…). */
const SYSTEM_RE =
  /end-to-end encrypt|messages and calls|joined the group|left the group|changed the group|changed this group's|was added|were added|you were added|security code changed/i;

export function parseExport(rawText: string): WaMessage[] {
  const messages: WaMessage[] = [];
  let current: WaMessage | null = null;

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.replace(/^[\u200E\u200F\uFEFF]/, '');
    if (!line.trim()) continue;

    let matched = false;
    for (const pat of LINE_PATTERNS) {
      const m = line.match(pat);
      if (m) {
        matched = true;
        if (current) messages.push(current);
        const sender = m[3].trim();
        const text = (m[4] || '').trim();
        const attach = text.match(ATTACHMENT_RE);
        current = {
          sender,
          text,
          date: m[1].trim(),
          attachment: attach ? (attach[1] || '').trim() : undefined,
        };
        break;
      }
    }
    if (!matched && current) {
      // Continuation of the previous message (multi-line posting)
      current.text += '\n' + line.trim();
      const attach = line.match(ATTACHMENT_RE);
      if (attach && attach[1] && !current.attachment) current.attachment = attach[1].trim();
    }
  }
  if (current) messages.push(current);
  return messages.filter((m) => !SYSTEM_RE.test(m.text));
}

// ---------------------------------------------------------------------------
// 2. Classification
// ---------------------------------------------------------------------------

export type PostingKind = 'load' | 'vehicle' | 'chatter';

const VEHICLE_SIGNALS =
  /گاڑی\s*خالی|خالی\s*گاڑی|خالی\s*ہے|empty\s*(vehicle|truck|gari|gaari)|vehicle\s*available|truck\s*available|khali\s*(gaari|gari)?/i;
const LOAD_NEED_VEHICLE = /گاڑی\s*چاہیے|گاڑی\s*چاہئے|vehicle\s*(chahiye|required|needed)|gaari\s*chahiye/i;
const LOAD_SIGNALS =
  /لوڈ|وزن|کرایہ|fare|weight|load(ing|ed)?\s*(hai|available|hoga)|bharti|بھرتی|مال\s*(لوڈ|ہے)|unloading|ان لوڈنگ|\bfrom\b.+\bto\b/i;

export function classifyMessage(text: string): PostingKind {
  const t = text;
  if (VEHICLE_SIGNALS.test(t) && !LOAD_NEED_VEHICLE.test(t)) return 'vehicle';
  if (LOAD_NEED_VEHICLE.test(t) || LOAD_SIGNALS.test(t)) return 'load';
  return 'chatter';
}

// ---------------------------------------------------------------------------
// 3. Field extraction helpers
// ---------------------------------------------------------------------------

/** Normalize a phone match to 03XXXXXXXXX form. Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('03')) return digits;
  if (digits.length === 12 && digits.startsWith('92')) return '0' + digits.slice(2);
  if (digits.length === 10 && digits.startsWith('3')) return '0' + digits;
  return null;
}

export function extractPhones(text: string): string[] {
  const out: string[] = [];
  const re = /(?:\+?92|0)?3\d{2}[\s-]?\d{7}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = normalizePhone(m[0]);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

const JUNK_CITY_TAIL =
  /\s*(گاڑی|گاری|لوڈ|مال|خالی|چاہیے|چاہئے|سے رابطہ|رابطہ|فون|نمبر|والا|والی|truck|vehicle|load|empty|available)$/i;

/** Normalize a city mention to the Urdu name used on the website. */
export function normalizeCityName(raw: string): string {
  let c = raw.replace(/[\u200B-\u200D\uFEFF]/g, ' ').replace(/\s+/g, ' ').trim();
  c = c.replace(JUNK_CITY_TAIL, '').trim();
  if (!c) return '';
  const mapped = mapToUrduCity(c);
  return mapped || c;
}

const KNOWN_URDU_CITIES = new Set<string>(Object.values(CITY_EN_TO_UR));

/** True when the text is a city the website knows (English-mappable or already Urdu). */
export function isKnownCity(raw: string): boolean {
  const c = raw.replace(/[\u200B-\u200D\uFEFF]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!c) return false;
  if (mapToUrduCity(c)) return true;
  return KNOWN_URDU_CITIES.has(c);
}

/**
 * Route extraction via separator scan: find each occurrence of a route
 * separator (سے / تا / to / ->), take a window of text on each side, and
 * pick the longest known-city phrase from each window. Trying every
 * occurrence (not just the first regex match) handles sentences like
 * "اس سے پہلے لیہ سے فیصل آباد".
 */
const ROUTE_SEPS = ['سے', 'تا', 'to', '->'];

function isSepBoundary(text: string, idx: number, sepLen: number): boolean {
  const before = idx === 0 ? ' ' : text[idx - 1];
  const after = idx + sepLen >= text.length ? ' ' : text[idx + sepLen];
  const wordChar = /[؀-ۿA-Za-z0-9]/;
  return !wordChar.test(before) && !wordChar.test(after);
}

/**
 * From a raw city chunk, pick the longest sub-phrase that is a known city.
 * Origin chunks drop LEADING words ("لوڈ ہے لیہ" -> "لیہ");
 * destination chunks drop TRAILING words ("فیصل آباد مال" -> "فیصل آباد").
 */
function pickKnownCity(chunk: string, fromStart: boolean): string {
  const words = chunk
    .replace(/[،,.:;()""'“”]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  if (fromStart) {
    for (let i = 0; i < words.length; i++) {
      const cand = words.slice(i).join(' ');
      if (isKnownCity(cand)) return normalizeCityName(cand);
    }
  } else {
    for (let i = words.length; i > 0; i--) {
      const cand = words.slice(0, i).join(' ');
      if (isKnownCity(cand)) return normalizeCityName(cand);
    }
  }
  return '';
}

export function extractRoute(text: string): { loadingCity: string; destinationCity: string } {
  for (const sep of ROUTE_SEPS) {
    let fromIdx = 0;
    let guard = 0;
    while (guard++ < 30) {
      const idx = text.indexOf(sep, fromIdx);
      if (idx === -1) break;
      fromIdx = idx + sep.length;
      if (!isSepBoundary(text, idx, sep.length)) continue;
      const before = text.slice(Math.max(0, idx - 45), idx);
      const after = text.slice(idx + sep.length, idx + sep.length + 45);
      const from = pickKnownCity(before, true);
      if (!from) continue;
      const to = pickKnownCity(after, false);
      if (from !== to) return { loadingCity: from, destinationCity: to || '' };
    }
  }
  return { loadingCity: '', destinationCity: '' };
}

const KNOWN_GOODS: { re: RegExp; urdu: string }[] = [
  { re: /مشینری|machinery/i, urdu: 'مشینری' },
  { re: /فرنیچر|furniture/i, urdu: 'فرنیچر' },
  { re: /گھر\s*(کا\s*)?سامان|household/i, urdu: 'گھر سامان' },
  { re: /باجرہ|bajra/i, urdu: 'باجرہ' },
  { re: /گندم|wheat/i, urdu: 'گندم' },
  { re: /چاول|rice/i, urdu: 'چاول' },
  { re: /کپاس|cotton/i, urdu: 'کپاس' },
  { re: /سیمنٹ|cement/i, urdu: 'سیمنٹ' },
  { re: /سریا|sariya|steel/i, urdu: 'سریا' },
  { re: /کھاد|fertilizer/i, urdu: 'کھاد' },
  { re: /چینی|sugar/i, urdu: 'چینی' },
  { re: /آٹا|flour/i, urdu: 'آٹا' },
  { re: /فوڈ|food|کھانے/i, urdu: 'فوڈ' },
  { re: /جانور|مویشی|cattle/i, urdu: 'جانور' },
  { re: /لکڑی|wood|timber/i, urdu: 'لکڑی' },
  { re: /پتھر|stone/i, urdu: 'پتھر' },
  { re: /ریت|sand/i, urdu: 'ریت' },
  { re: /بجری|crush/i, urdu: 'بجری' },
  { re: /کپڑا|cloth|textile/i, urdu: 'کپڑا' },
  { re: /دالیں|pulses/i, urdu: 'دالیں' },
  { re: /تیل|oil/i, urdu: 'تیل' },
  { re: /پھل|fruit/i, urdu: 'پھل' },
  { re: /سبزی|vegetable/i, urdu: 'سبزی' },
];

export function extractGoods(text: string): string {
  // Explicit "مال: X" / "goods: X" label wins
  const labeled = text.match(/(?:مال|goods)\s*[:：]\s*([^\n،,]{2,40})/i);
  if (labeled) {
    const g = labeled[1].replace(/\([^)]*\)/g, '').trim();
    if (g && !/خالی|چاہیے|چاہئے/i.test(g)) return g;
  }
  for (const k of KNOWN_GOODS) {
    if (k.re.test(text)) return k.urdu;
  }
  return 'حاضر مال';
}

export function extractWeight(text: string): string {
  const m = text.match(
    /وزن\s*[:：]?\s*([\d.,]+\s*(?:ٹن|کلو|من|kg|ton|tons|mun))|weight\s*[:：]?\s*([\d.,]+\s*(?:kg|ton|tons))/i
  );
  return m ? (m[1] || m[2] || '').trim() : '';
}

export function extractFare(text: string): string {
  const m = text.match(/کرایہ\s*[:：]?\s*([\d,]+)|fare\s*[:：]?\s*([\d,]+)/i);
  return m ? (m[1] || m[2] || '').replace(/,/g, '') : '';
}

const TYPE_ALIAS_RE: { re: RegExp; value: string }[] = [
  { re: /ٹرالہ|ٹرالر|trailer/i, value: '22 Wheeler' },
  { re: /22\s*وہیلر/i, value: '22 Wheeler' },
  { re: /مزدا/i, value: 'Mazda' },
  { re: /شاہزور|shahzor/i, value: 'Shahzor' },
  { re: /سوزوکی/i, value: 'Suzuki Pickup' },
  { re: /ڈمپر|dumper/i, value: 'Dumper' },
  { re: /کنٹینر|container/i, value: '40 Foot Container' },
];

/** Match a vehicle type mention against the shared 41-type list. Returns the Latin value. */
export function extractVehicleType(text: string): string {
  const t = text.toLowerCase();
  for (const opt of PAKISTAN_VEHICLE_TYPES) {
    const v = opt.value.toLowerCase();
    if (v.length >= 3 && t.includes(v)) return opt.value;
    if (opt.urdu && t.includes(opt.urdu.toLowerCase())) return opt.value;
  }
  for (const a of TYPE_ALIAS_RE) {
    if (a.re.test(text)) return a.value;
  }
  return '';
}

const COMPANY_RE =
  /ٹرانسپورٹ|گڈز|کمپنی|برادرز|ایسوسی\s*ایشن|ایسوسی ایشن|کارپوریشن|ایجنسی|ٹرینڈرز/;

export function extractAddaName(text: string, sender: string): string {
  const fragments = text.split(/[\n،,]/).map((f) => f.trim()).filter(Boolean);
  let best = '';
  for (const f of fragments) {
    if (COMPANY_RE.test(f) && f.length > best.length && f.length < 90) best = f;
  }
  if (best) return best.replace(/\([^)]*\)/g, '').trim();
  return 'ڈائریکٹ پارٹی';
}

export function extractManagerName(text: string, sender: string): string {
  const m = text.match(/(?:رابطہ|نام)\s*[:：]?\s*([\u0600-\u06FF\s]{3,30}?)(?=\d|\(|$)/);
  if (m && m[1].trim().length >= 3) return m[1].trim();
  const clean = sender.replace(/[^؀-ۿ\w\s]/g, '').trim();
  return clean || 'ڈائریکٹ پارٹی';
}

// ---------------------------------------------------------------------------
// 4. Builders
// ---------------------------------------------------------------------------

function datePrefixOf(dateStr: string): string {
  // Accept M/D/YY, M/D/YYYY, DD/MM/YYYY — produce YYYYMMDD
  const m = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
  let [, a, b, y] = m;
  if (y.length === 2) y = '20' + y;
  // Heuristic: if first part > 12 it must be the day (DD/MM/YYYY)
  const first = parseInt(a, 10);
  const day = first > 12 ? a.padStart(2, '0') : b.padStart(2, '0');
  const month = first > 12 ? b.padStart(2, '0') : a.padStart(2, '0');
  return `${y}${month}${day}`;
}

function nextWaId(prefix: string, dateStr: string, used: Set<string>): string {
  const dp = datePrefixOf(dateStr);
  let seq = 1;
  let id = `${prefix}${dp}${String(seq).padStart(4, '0')}`;
  while (used.has(id)) {
    seq += 1;
    id = `${prefix}${dp}${String(seq).padStart(4, '0')}`;
  }
  used.add(id);
  return id;
}

const urduComma = (s: string) => s.replace(/,/g, '،');

function buildLoadSlip(
  msg: WaMessage,
  usedIds: Set<string>,
  seenKeys: Set<string>
): { slip?: LoadSlip; skipReason?: string } {
  const route = extractRoute(msg.text);
  const phones = extractPhones(msg.text);
  if (!route.loadingCity) return { skipReason: 'پک اپ شہر درج نہیں' };
  if (phones.length === 0) return { skipReason: 'رابطہ نمبر درج نہیں' };

  const goods = urduComma(extractGoods(msg.text));
  const key = `${route.loadingCity}|${route.destinationCity}|${phones[0]}|${goods}`;
  if (seenKeys.has(key)) return { skipReason: 'ڈپلیکیٹ پوسٹنگ' };
  seenKeys.add(key);

  const now = new Date().toISOString();
  const addaName = extractAddaName(msg.text, msg.sender);
  const slip: LoadSlip = {
    id: nextWaId('WA', msg.date, usedIds),
    addaId: 'whatsapp-import',
    addaName,
    addaCity: route.loadingCity,
    managerName: extractManagerName(msg.text, msg.sender),
    primaryPhone: phones[0],
    whatsappNumber: phones[0],
    additionalContacts: phones.slice(1),
    loadingCity: route.loadingCity,
    loadingLocation: route.loadingCity,
    destinationCity: route.destinationCity || route.loadingCity,
    destinationLocation: route.destinationCity || route.loadingCity,
    goods,
    weight: extractWeight(msg.text),
    quantity: '',
    vehicleType: extractVehicleType(msg.text),
    bodyType: '',
    fareOffer: extractFare(msg.text) || undefined,
    specialInstructions: undefined,
    status: 'active',
    createdAt: now,
    viewsCount: 0,
    sharesCount: 0,
    source: 'whatsapp',
  };
  return { slip };
}

function buildTruck(
  msg: WaMessage,
  usedIds: Set<string>,
  seenKeys: Set<string>
): { truck?: AvailableTruck; skipReason?: string } {
  const phones = extractPhones(msg.text);
  if (phones.length === 0) return { skipReason: 'رابطہ نمبر درج نہیں' };

  // Current city: route "X سے Y" -> X is current; else first city mention
  const route = extractRoute(msg.text);
  let city = route.loadingCity;
  if (!city) {
    // Fallback: first recognizable KNOWN city token in the message
    const tokens = msg.text.split(/[\s،,.\n]+/);
    for (const tok of tokens) {
      if (tok.length >= 3 && isKnownCity(tok)) {
        city = normalizeCityName(tok);
        break;
      }
    }
  }
  if (!city) return { skipReason: 'موجودہ شہر درج نہیں' };

  const key = `truck|${city}|${phones[0]}|${extractVehicleType(msg.text)}`;
  if (seenKeys.has(key)) return { skipReason: 'ڈپلیکیٹ پوسٹنگ' };
  seenKeys.add(key);

  const truck: AvailableTruck = {
    id: nextWaId('WAT', msg.date, usedIds),
    driverOrOwnerName: extractManagerName(msg.text, msg.sender),
    phone: phones[0],
    whatsappNumber: phones[0],
    vehicleType: extractVehicleType(msg.text) || 'Mazda',
    bodyType: '',
    currentCity: city,
    preferredRoute: route.destinationCity
      ? `${route.loadingCity} تا ${route.destinationCity}`
      : undefined,
    createdAt: new Date().toISOString(),
    status: 'available',
    source: 'whatsapp',
  };
  return { truck };
}

// ---------------------------------------------------------------------------
// 5. Main entry
// ---------------------------------------------------------------------------

export interface ParseOptions {
  existingSlips?: LoadSlip[];
  existingTrucks?: AvailableTruck[];
  /** Extra transcript messages (e.g. from voice notes) to parse as chat lines */
  extraMessages?: WaMessage[];
}

export function parseChatExport(rawText: string, opts: ParseOptions = {}): ParsedImport {
  const messages = parseExport(rawText);
  const all = opts.extraMessages ? [...messages, ...opts.extraMessages] : messages;

  const usedIds = new Set<string>([
    ...(opts.existingSlips || []).map((s) => s.id),
    ...(opts.existingTrucks || []).map((t) => t.id),
  ]);
  const seenKeys = new Set<string>();
  // Seed batch-dedupe with existing records
  for (const s of opts.existingSlips || []) {
    seenKeys.add(`${s.loadingCity}|${s.destinationCity}|${s.primaryPhone}|${s.goods}`);
  }

  const out: ParsedImport = { loads: [], vehicles: [], skipped: [] };

  for (const msg of all) {
    const isMediaOnly =
      (!msg.text || OMITTED_RE.test(msg.text)) && !msg.attachment;
    if (isMediaOnly) {
      out.skipped.push({ reason: 'صرف میڈیا (متن نہیں)', text: msg.text, sender: msg.sender });
      continue;
    }
    const kind = classifyMessage(msg.text);
    if (kind === 'chatter') continue;

    if (kind === 'load') {
      const { slip, skipReason } = buildLoadSlip(msg, usedIds, seenKeys);
      if (slip) out.loads.push(slip);
      else out.skipped.push({ reason: skipReason || 'نامکمل پوسٹ', text: msg.text.slice(0, 160), sender: msg.sender });
    } else {
      const { truck, skipReason } = buildTruck(msg, usedIds, seenKeys);
      if (truck) out.vehicles.push(truck);
      else out.skipped.push({ reason: skipReason || 'نامکمل پوسٹ', text: msg.text.slice(0, 160), sender: msg.sender });
    }
  }
  return out;
}

/** Wrap a voice-note transcript so it can be parsed like a chat message. */
export function transcriptToMessage(transcript: string, sender: string, fileName: string): WaMessage {
  return { sender, text: transcript, date: new Date().toLocaleDateString('en-US'), attachment: fileName };
}
