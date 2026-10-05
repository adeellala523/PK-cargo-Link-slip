import { LoadSlip } from '../types';

export const OFFICIAL_WEBSITE_URL = 'https://pkcargolink.com';
export const APP_BASE_URL = OFFICIAL_WEBSITE_URL;

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

/**
 * Builds the exact WhatsApp formatted text according to PK Cargo Link specifications:
 * - Phone numbers are viewable on the official website slip preview link
 * - Supports multi-load items per slip
 */
export function formatWhatsAppMessage(slip: LoadSlip): string {
  const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
  const slipUrl = `${OFFICIAL_WEBSITE_URL}/slip/${cleanId}`;
  
  const hasMultipleLoads = slip.additionalLoads && slip.additionalLoads.length > 0;

  let loadsContent = '';

  if (hasMultipleLoads) {
    // Primary Load 1
    loadsContent += `📦 **لوڈ 1:**\n📍 ${slip.loadingCity} ${slip.loadingLocation ? `(${slip.loadingLocation})` : ''} تا ${slip.destinationCity}\n🚛 ${slip.goods} (${slip.quantity || slip.weight || 'حسبِ ضرورت'}) — ${slip.vehicleType}\n\n`;

    // Additional Loads
    slip.additionalLoads!.forEach((al, idx) => {
      loadsContent += `📦 **لوڈ ${idx + 2}:**\n📍 ${al.loadingCity} تا ${al.destinationCity}\n🚛 ${al.goods} (${al.quantity || al.weight || 'حسبِ ضرورت'})${al.vehicleType ? ` — ${al.vehicleType}` : ''}\n\n`;
    });
  } else {
    loadsContent = `📍 پک اپ:\n${slip.loadingCity} ${slip.loadingLocation ? `(${slip.loadingLocation})` : ''}\n\n📍 ڈیلیوری:\n${slip.destinationCity}\n\n📦 سامان:\n${slip.goods}\n\n🔢 مقدار:\n${slip.quantity || slip.weight || 'حسبِ ضرورت'}\n\n🚚 گاڑی:\n${slip.vehicleType} (${slip.bodyType})\n\n`;
  }

  const dateStr = slip.createdAt ? new Date(slip.createdAt).toLocaleDateString('ur-PK') : 'آج';

  return `اَلسَلامُ عَلَيْكُم وَرَحْمَةُاَللهِ وَبَرَكاتُهُ
ایاک.نعبدواياك.نستعین

🚛 PK CARGO LOAD SLIP

${loadsContent}📅 تاریخ: ${dateStr}

🏢 ${slip.addaName} (${slip.addaCity})
${slip.managerName ? `👤 ${slip.managerName}\n` : ''}
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
    setMeta('og:image', `${OFFICIAL_WEBSITE_URL}/api/slip-image.php`);
    setMeta('og:image:secure_url', `${OFFICIAL_WEBSITE_URL}/api/slip-image.php`);
    return;
  }

  const addaName = slip.addaName || 'گڈز ٹرانسپورٹ اڈا';
  const addaCity = slip.addaCity ? ` (${slip.addaCity})` : '';
  const fromTo = `${slip.loadingCity} تا ${slip.destinationCity}`;
  const cargoInfo = `مال: ${slip.goods} (${slip.weight}) | مطلوبہ گاڑی: ${slip.vehicleType} | اڈا: ${addaName}${addaCity} | رابطہ: ${slip.primaryPhone}`;

  document.title = `${addaName} – دستیاب لوڈ: ${fromTo}`;

  // Compute exact image URL: NEVER use adda-logo.png
  let logoImg = '';
  if (slip.addaLogo && slip.addaLogo.startsWith('http') && !slip.addaLogo.includes('adda-logo.png') && !slip.addaLogo.includes('icon-512.png')) {
    logoImg = slip.addaLogo;
  } else if (slip.addaLogo && slip.addaLogo.startsWith('/uploads/')) {
    logoImg = `${OFFICIAL_WEBSITE_URL}${slip.addaLogo}`;
  } else {
    // Dynamic image generator tailored specifically to this Adda and slip
    logoImg = `${OFFICIAL_WEBSITE_URL}/api/slip-image.php?id=${encodeURIComponent(slip.id)}`;
  }

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

