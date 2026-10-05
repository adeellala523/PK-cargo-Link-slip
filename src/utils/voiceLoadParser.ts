import { SingleLoadItem } from '../types';

interface CityDictionaryItem {
  canonical: string;
  aliases: string[];
}

export const PAKISTANI_CITIES_DICT: CityDictionaryItem[] = [
  { canonical: 'بہاولپور', aliases: ['بہاولپور', 'بہاول پور', 'bahawalpur', 'bhawalpur'] },
  { canonical: 'کراچی', aliases: ['کراچی', 'karachi', 'khi'] },
  { canonical: 'کبیروالا', aliases: ['کبیروالا', 'کبیر والا', 'kabirwala', 'kabeerwala'] },
  { canonical: 'ٹھینگ موڑ', aliases: ['ٹھینگ موڑ', 'ٹھینگ', 'theeng mor', 'theng mor', 'theengmor'] },
  { canonical: 'وہاڑی', aliases: ['وہاڑی', 'vehari', 'vihari'] },
  { canonical: 'لاہور', aliases: ['لاہور', 'lahore', 'lhr'] },
  { canonical: 'ملتان', aliases: ['ملتان', 'multan', 'mux'] },
  { canonical: 'فیصل آباد', aliases: ['فیصل آباد', 'فیصلآباد', 'faisalabad', 'fsd'] },
  { canonical: 'راولپنڈی', aliases: ['راولپنڈی', 'rawalpindi', 'pindi'] },
  { canonical: 'اسلام آباد', aliases: ['اسلام آباد', 'islamabad', 'isb'] },
  { canonical: 'پشاور', aliases: ['پشاور', 'peshawar', 'pew'] },
  { canonical: 'کوئٹہ', aliases: ['کوئٹہ', 'quetta', 'uta'] },
  { canonical: 'گوجرانوالہ', aliases: ['گوجرانوالہ', 'gujranwala'] },
  { canonical: 'سیالکوٹ', aliases: ['سیالکوٹ', 'sialkot'] },
  { canonical: 'ساہیوال', aliases: ['ساہیوال', 'sahiwal'] },
  { canonical: 'رحیم یار خان', aliases: ['رحیم یار خان', 'رحیمیارخان', 'rahim yar khan', 'ryk'] },
  { canonical: 'سرگودھا', aliases: ['سرگودھا', 'sargodha'] },
  { canonical: 'سکھر', aliases: ['سکھر', 'sukkur'] },
  { canonical: 'حیدرآباد', aliases: ['حیدرآباد', 'hyderabad'] },
  { canonical: 'ڈیرہ غازی خان', aliases: ['ڈیرہ غازی خان', 'ڈی جی خان', 'dg khan', 'd g khan'] },
  { canonical: 'اوکاڑہ', aliases: ['اوکاڑہ', 'okara'] },
  { canonical: 'خانیوال', aliases: ['خانیوال', 'khanewal'] },
  { canonical: 'شیخوپورہ', aliases: ['شیخوپورہ', 'sheikhupura'] },
  { canonical: 'جھنگ', aliases: ['جھنگ', 'jhang'] },
  { canonical: 'چنیوٹ', aliases: ['چنیوٹ', 'chiniot'] },
  { canonical: 'قصور', aliases: ['قصور', 'kasur'] },
  { canonical: 'گجرات', aliases: ['گجرات', 'gujrat'] },
  { canonical: 'مردان', aliases: ['مردان', 'mardan'] },
  { canonical: 'میانوالی', aliases: ['میانوالی', 'mianwali'] },
  { canonical: 'بھکر', aliases: ['بھکر', 'bhakkar'] },
  { canonical: 'پتوکی', aliases: ['پتوکی', 'pattoki'] },
  { canonical: 'چشتیاں', aliases: ['چشتیاں', 'chishtian'] },
  { canonical: 'بورے والا', aliases: ['بورے والا', 'burewala'] },
  { canonical: 'لودھراں', aliases: ['لودھراں', 'lodhran'] },
  { canonical: 'حافظ آباد', aliases: ['حافظ آباد', 'hafizabad'] },
  { canonical: 'مظفر گڑھ', aliases: ['مظفر گڑھ', 'muzaffargarh'] },
];

export const COMMODITIES_DICT = [
  { canonical: 'مکئی', aliases: ['مکئی', 'مکی', 'makai', 'makki', 'corn', 'maize'] },
  { canonical: 'گندم', aliases: ['گندم', 'کنک', 'gandum', 'wheat'] },
  { canonical: 'چاول', aliases: ['چاول', 'chawal', 'rice'] },
  { canonical: 'کپاس', aliases: ['کپاس', 'روئی', 'پھٹی', 'cotton', 'phutti'] },
  { canonical: 'کھاد', aliases: ['کھاد', 'یوریا', 'ڈی اے پی', 'khad', 'fertilizer', 'urea'] },
  { canonical: 'سیمنٹ', aliases: ['سیمنٹ', 'cement'] },
  { canonical: 'لوہا و سریا', aliases: ['لوہا', 'سریا', 'سٹیل', 'steel', 'iron'] },
  { canonical: 'کوئلہ', aliases: ['کوئلہ', 'coal'] },
  { canonical: 'چینی', aliases: ['چینی', 'sugar'] },
  { canonical: 'آٹا', aliases: ['آٹا', 'فلور', 'flour'] },
  { canonical: 'فیڈ', aliases: ['فیڈ', 'پولٹری فیڈ', 'feed'] },
  { canonical: 'فروٹ و سبزی', aliases: ['فروٹ', 'سبزی', 'پھل', 'fruit', 'vegetable', 'mango', 'kinnow', 'آلو', 'پیاز'] },
  { canonical: 'کریانہ جنرل', aliases: ['کریانہ', 'جنرل', 'karyana', 'general'] },
];

export const VEHICLE_DICT = [
  { canonical: '22 Wheeler', aliases: ['22 وہیلر', 'بائیس وہیلر', '22 wheeler', '22wheeler', 'ٹرالہ', 'tralla', 'trolla'] },
  { canonical: '10 Wheeler', aliases: ['10 وہیلر', 'دس وہیلر', '10 wheeler', '10wheeler', 'ٹین وہیلر'] },
  { canonical: 'Shahzor', aliases: ['شاہزور', 'شہزور', 'shahzor', 'shehzore'] },
  { canonical: 'JAC', aliases: ['جیک', 'jac'] },
  { canonical: 'Porter', aliases: ['پورٹر', 'porter'] },
  { canonical: 'Mazda 16 Foot', aliases: ['مزدہ 16 فٹ', 'مزدہ سولہ فٹ', 'mazda 16'] },
  { canonical: 'Mazda 18 Foot', aliases: ['مزدہ 18 فٹ', 'مزدہ اٹھارہ فٹ', 'mazda 18'] },
  { canonical: 'Mazda 20 Foot', aliases: ['مزدہ 20 فٹ', 'مزدہ بیس فٹ', 'mazda 20'] },
  { canonical: 'Mazda', aliases: ['مزدہ', 'مزدا', 'mazda'] },
  { canonical: '40 Foot Container', aliases: ['40 فٹ کنٹینر', 'چالیس فٹ کنٹینر', '40 foot container'] },
  { canonical: '40 Foot', aliases: ['40 فٹ', '40 foot'] },
];

function findCity(str: string): string | null {
  const lower = str.toLowerCase();
  for (const city of PAKISTANI_CITIES_DICT) {
    for (const alias of city.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return city.canonical;
      }
    }
  }
  return null;
}

function findGoods(str: string): string | null {
  const lower = str.toLowerCase();
  for (const comm of COMMODITIES_DICT) {
    for (const alias of comm.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return comm.canonical;
      }
    }
  }
  return null;
}

function findVehicle(str: string): string | null {
  const lower = str.toLowerCase();
  for (const v of VEHICLE_DICT) {
    for (const alias of v.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return v.canonical;
      }
    }
  }
  return null;
}

function findWeightOrQuantity(str: string): string | null {
  // Looks for e.g. "30 ٹن", "500 بوریاں", "40 ton", "600 bags"
  const matchTonUr = str.match(/(\d+)\s*(ٹن|ton|tons)/i);
  if (matchTonUr) return `${matchTonUr[1]} ٹن`;

  const matchBags = str.match(/(\d+)\s*(بوریاں|بوری|بیگ|تھیلے|bags|bag)/i);
  if (matchBags) return `${matchBags[1]} بوریاں`;

  return null;
}

/**
 * Splits raw transcript into candidate load chunks.
 * Handles:
 * - "دوسرا", "تیسرا", "چوتھا", "اور دوسرا"
 * - Comma delimiters "،" or ","
 * - Newlines or semicolons
 * - Implicit boundaries if multiple city pairs exist
 */
export function splitIntoLoadChunks(rawText: string): string[] {
  let cleaned = rawText
    .replace(/اَلسَلامُ عَلَيْكُم.*?(وبرکاتہ|نستعین)/gis, '')
    .trim();

  // If contains explicit load ordinal indicators like "دوسرا لوڈ", "تیسرا لوڈ", "اگلا لوڈ", "next load"
  const ordinalPattern = /(?:اور\s+)?(?:دوسرا|تیسرا|چوتھا|اگلا|next)\s*(?:لوڈ)?[:،,\s]/gi;
  if (ordinalPattern.test(cleaned)) {
    const parts = cleaned.split(/(?:اور\s+)?(?:دوسرا|تیسرا|چوتھا|اگلا|next)\s*(?:لوڈ)?[:،,\s]/gi);
    const valid = parts.map(p => p.trim()).filter(Boolean);
    if (valid.length > 1) return valid;
  }

  // Check commas or newlines
  const commaParts = cleaned.split(/[\n،,;]+/).map(p => p.trim()).filter(Boolean);
  if (commaParts.length > 1) {
    // If each part contains either a commodity or city, treat as separate loads
    const hasGoodsCount = commaParts.filter(p => findGoods(p) !== null).length;
    if (hasGoodsCount >= 2) {
      return commaParts;
    }
  }

  // Check if multiple goods appear in single sentence (e.g. "بہاولپور کراچی مکئی اور کبیروالا کراچی گندم")
  if (cleaned.includes(' اور ')) {
    const aurParts = cleaned.split(/\s+اور\s+/).map(p => p.trim()).filter(Boolean);
    const validAur = aurParts.filter(p => findGoods(p) !== null);
    if (validAur.length >= 2) {
      return aurParts;
    }
  }

  return [cleaned];
}

/**
 * Parses a single chunk into a SingleLoadItem with STRICT SAFETY:
 * NEVER invents missing information!
 */
export function parseSingleLoadChunk(chunk: string): SingleLoadItem {
  const item: SingleLoadItem = {
    goods: '',
    loadingCity: '',
    destinationCity: '',
    weight: '',
    quantity: '',
    vehicleType: '',
    bodyType: '',
  };

  const detectedGoods = findGoods(chunk);
  if (detectedGoods) {
    item.goods = detectedGoods;
  } else {
    // If no catalog goods found, check if word before "لوڈ" or "مال"
    const genericMatch = chunk.match(/([\u0600-\u06FF\w\s]{2,15})\s*(?:کا\s+لوڈ|لوڈنگ|کا\s+مال)/i);
    if (genericMatch && genericMatch[1]) {
      const g = genericMatch[1].replace(/سے|تا|کو|کا/g, '').trim();
      if (g.length > 1 && !findCity(g)) {
        item.goods = g;
      }
    }
  }

  // Detect Cities
  // 1. Look for "سے" pattern: "بہاولپور سے کراچی"
  const seMatch = chunk.match(/([\u0600-\u06FF\w\s]+?)\s+(?:سے|from)\s+([\u0600-\u06FF\w\s]+?)(?:\s+(?:تا|کو|to|جا\s+رہا)|\s+|$)/i);
  if (seMatch) {
    const fromCity = findCity(seMatch[1]);
    const toCity = findCity(seMatch[2]);
    if (fromCity) item.loadingCity = fromCity;
    if (toCity) item.destinationCity = toCity;
  }

  // 2. Fallback: match all cities in chunk order
  if (!item.loadingCity || !item.destinationCity) {
    const matches: Array<{ index: number; city: string }> = [];
    const lower = chunk.toLowerCase();
    for (const city of PAKISTANI_CITIES_DICT) {
      for (const alias of city.aliases) {
        const idx = lower.indexOf(alias.toLowerCase());
        if (idx !== -1) {
          matches.push({ index: idx, city: city.canonical });
          break;
        }
      }
    }
    matches.sort((a, b) => a.index - b.index);
    const foundCities = Array.from(new Set(matches.map(m => m.city)));

    if (foundCities.length >= 2) {
      if (!item.loadingCity) item.loadingCity = foundCities[0];
      if (!item.destinationCity) item.destinationCity = foundCities[1];
    } else if (foundCities.length === 1) {
      // Short voice check: e.g. "کراچی مکئی"
      // If word before/after has "سے", it's loading, if "تا" or destination common (like کراچی), it's destination
      if (chunk.includes('سے')) {
        item.loadingCity = foundCities[0];
      } else {
        item.destinationCity = foundCities[0];
      }
    }
  }

  // Optional: vehicle & weight (ONLY if spoken, never invent!)
  const detectedVehicle = findVehicle(chunk);
  if (detectedVehicle) {
    item.vehicleType = detectedVehicle;
  }

  const detectedWeight = findWeightOrQuantity(chunk);
  if (detectedWeight) {
    item.weight = detectedWeight;
    item.quantity = detectedWeight;
  }

  return item;
}

/**
 * Main parser entry point: Parses Urdu/Roman Urdu text into an array of SingleLoadItem
 */
export function parseVoiceToLoads(text: string): SingleLoadItem[] {
  if (!text || !text.trim()) return [];

  const chunks = splitIntoLoadChunks(text);
  const loads: SingleLoadItem[] = [];

  for (const chunk of chunks) {
    const load = parseSingleLoadChunk(chunk);
    // Include if it has at least a good or city
    if (load.goods || load.loadingCity || load.destinationCity) {
      loads.push(load);
    }
  }

  // If no load extracted but text exists, return one empty draft with whatever words
  if (loads.length === 0 && text.trim().length > 0) {
    loads.push({
      goods: '',
      loadingCity: '',
      destinationCity: '',
      weight: '',
      quantity: '',
      vehicleType: '',
    });
  }

  return loads;
}
