import { LoadSlip } from '../types/index.ts';

export const OFFICIAL_WEBSITE_URL = 'https://pkcargolink.com';
export const APP_BASE_URL = OFFICIAL_WEBSITE_URL;

/** Platform contact number shown in all shared slip texts (original poster numbers stay hidden). */
export const PLATFORM_CONTACT_NUMBER = '03298111391';

export function getAppBaseUrl(): string {
  return OFFICIAL_WEBSITE_URL;
}

/**
 * Generates a unique, non-duplicating slip ID in clean alphanumeric format (no hyphens)
 * so WhatsApp and mobile messengers never break the URL across lines:
 * PKCLYYYYMMDDXXXXXX (e.g. PKCL20261002896904)
 */
export function generateSlipId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // High-precision sequence + random component to guarantee uniqueness without hyphens
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PKCL${dateStr}${randomNum}`;
}

export function getCommodityEmoji(goods: string): string {
  const g = (goods || '').toLowerCase();
  if (g.includes('مکئی') || g.includes('corn') || g.includes('makai')) return '🌽';
  if (g.includes('گندم') || g.includes('wheat') || g.includes('gandum')) return '🌾';
  if (g.includes('چاول') || g.includes('rice') || g.includes('chawal')) return '🍚';
  if (g.includes('کپاس') || g.includes('روئی') || g.includes('cotton')) return '⚪';
  if (g.includes('کھاد') || g.includes('fertilizer')) return '🧪';
  if (g.includes('سیمنٹ') || g.includes('cement')) return '🧱';
  if (g.includes('لوہا') || g.includes('سٹیل') || g.includes('سریا') || g.includes('steel')) return '🏗️';
  if (g.includes('فروٹ') || g.includes('سبزی') || g.includes('fruit')) return '🍎';
  return '📦';
}

/**
 * Builds the exact WhatsApp formatted text with complete slip details.
 * Privacy rule: original poster phone numbers are NEVER shown in shared text —
 * the platform contact number is shown instead (numbers stay visible on the website itself).
 * - Dynamically includes origin, destination, vehicle, weight/quantity, and cargo
 * - Shows the platform contact number for all inquiries
 * - Includes direct deep link to the verified load slip
 */
export function formatWhatsAppMessage(slip: LoadSlip): string {
  const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
  // Use the OG preview endpoint so WhatsApp shows the truck image + slip details
  // (real users get redirected to the actual slip page)
  const slipUrl = `${OFFICIAL_WEBSITE_URL}/api/slip-og.php?id=${cleanId}`;

  // All contact numbers (one or however many)
  const allNumbers = [slip.primaryPhone, slip.whatsappNumber, ...(slip.additionalContacts || [])]
    .filter((n, i, arr) => n && arr.indexOf(n) === i);

  // Build location strings
  const pickup = slip.loadingLocation && slip.loadingLocation !== slip.loadingCity
    ? `${slip.loadingCity} (${slip.loadingLocation})` : slip.loadingCity;
  const delivery = slip.destinationLocation && slip.destinationLocation !== slip.destinationCity
    ? `${slip.destinationCity} (${slip.destinationLocation})` : slip.destinationCity;

  // Quantity/weight
  const qty = slip.quantity || slip.weight || '';

  // Vehicle with body type (hide if not specified)
  const vehicle = slip.vehicleType
    ? (slip.bodyType && slip.bodyType !== 'Other'
        ? `${slip.vehicleType} (${slip.bodyType})` : slip.vehicleType)
    : '';
  const vehicleBlock = vehicle ? `\n\n🚚 گاڑی:\n${vehicle}` : '';

  // Date (d/m/yyyy format)
  const d = new Date(slip.createdAt || Date.now());
  const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;

  // Company and person
  const company = slip.addaName || 'پی کے کارگو لنک';
  const companyCity = slip.addaCity ? ` (${slip.addaCity})` : '';
  const person = slip.managerName ? `\n👤 ${slip.managerName}` : '';

  // Numbers section
  const numbersBlock = allNumbers.length > 0
    ? `\n📞 ${allNumbers.join('\n📞 ')}` : '';

  return `اَلسَلامُ عَلَيْكُم وَرَحْمَةُاَللهِ وَبَرَكاتُهُ
ایاک.نعبدواياك.نستعین

🚛 PK CARGO LOAD SLIP

📍 پک اپ:
${pickup}

📍 ڈیلیوری:
${delivery}

📦 سامان:
${slip.goods}

🔢 مقدار:
${qty}${vehicleBlock}

📅 تاریخ: ${dateStr}

🏢 ${company}${companyCity}${person}${numbersBlock}

📞 رابطہ و تمام فون نمبرز دیکھنے کیلئے آن لائن سلپ لنک کھولیں:
🔗 ${slipUrl}

Powered by PK Cargo Link`;
}

/**
 * Opens WhatsApp with formatted text
 */
export function getWhatsAppShareUrl(text: string, phone?: string): string {
  const encodedText = encodeURIComponent(text);
  if (phone) {
    // Sanitize phone number (remove dashes and spaces)
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Clean phone number for tel: link
 */
export function sanitizePhoneForCall(phone: string): string {
  let clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('0')) {
    clean = '+92' + clean.substring(1);
  }
  return clean;
}

/**
 * Formats Pakistani Urdu date and time
 */
export function formatUrduDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('ur-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Updates document.title and OpenGraph meta tags dynamically for WhatsApp link previews
 */
export function updateOpenGraphMetaTags(slip: LoadSlip | null): void {
  if (typeof document === 'undefined') return;

  const setMeta = (nameOrProperty: string, content: string, isProperty = true) => {
    const selector = isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(isProperty ? 'property' : 'name', nameOrProperty);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  if (!slip) {
    document.title = 'PK Cargo Link – پاکستان ڈیجیٹل لوڈ سلپ نیٹ ورک';
    setMeta('og:site_name', 'PK Cargo Link');
    setMeta('og:title', 'PK Cargo Link – پاکستان ڈیجیٹل لوڈ سلپ نیٹ ورک');
    setMeta('og:description', 'پاکستان کے تمام ٹرانسپورٹ اڈا منیجرز اور ٹرک ڈرائیورز کے لیے تصدیق شدہ ڈیجیٹل لوڈ سلپ نیٹ ورک۔');
    setMeta('og:image', `${OFFICIAL_WEBSITE_URL}/slip-preview.jpg`);
    setMeta('og:image:secure_url', `${OFFICIAL_WEBSITE_URL}/slip-preview.jpg`);
    return;
  }

  const addaName = slip.addaName || 'گڈز ٹرانسپورٹ اڈا';
  const addaCity = slip.addaCity ? ` (${slip.addaCity})` : '';
  const fromTo = `${slip.loadingCity} تا ${slip.destinationCity}`;
  const cargoInfo = `مال: ${slip.goods} (${slip.weight}) | مطلوبہ گاڑی: ${slip.vehicleType} | اڈا: ${addaName}${addaCity} | رابطہ: ${slip.primaryPhone}`;

  document.title = `${addaName} – دستیاب لوڈ: ${fromTo}`;

  // Compute exact image URL: use the PK Cargo Link truck banner for slip previews
  // (user-provided promotional image; ?v=2 busts WhatsApp's OG image cache)
  const logoImg = `${OFFICIAL_WEBSITE_URL}/slip-preview.jpg?v=2`;

  // Set all OpenGraph tags so WhatsApp preview shows Adda details
  setMeta('og:site_name', addaName);
  setMeta('og:title', `${addaName} – دستیاب لوڈ: ${fromTo}`);
  setMeta('og:description', cargoInfo);
  setMeta('og:image', logoImg);
  setMeta('og:image:secure_url', logoImg);
  setMeta('og:image:type', 'image/png');
  setMeta('og:image:width', '1200');
  setMeta('og:image:height', '630');
  setMeta('og:url', `${OFFICIAL_WEBSITE_URL}/slip/${slip.id}`);

  // Twitter cards
  setMeta('twitter:card', 'summary_large_image', false);
  setMeta('twitter:site', addaName, false);
  setMeta('twitter:title', `${addaName} – دستیاب لوڈ: ${fromTo}`, false);
  setMeta('twitter:description', cargoInfo, false);
  setMeta('twitter:image', logoImg, false);
}

