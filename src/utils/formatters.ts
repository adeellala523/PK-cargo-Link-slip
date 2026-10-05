import { LoadSlip } from '../types/index.ts';

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
 * Builds the exact WhatsApp formatted text with complete details and unhidden phone numbers:
 * - Dynamically includes origin, destination, vehicle, weight/quantity, and cargo
 * - Unhides all primary and secondary phone numbers with manager/contact names
 * - Includes direct deep link to the verified load slip
 */
export function formatWhatsAppMessage(slip: LoadSlip): string {
  const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
  const slipUrl = `${OFFICIAL_WEBSITE_URL}/slip/${cleanId}`;
  
  const hasMultipleLoads = Boolean(slip.additionalLoads && slip.additionalLoads.length > 0);

  let loadsBlock = '';

  if (hasMultipleLoads) {
    // Primary Load 1
    const emoji1 = getCommodityEmoji(slip.goods);
    const goods1 = slip.goods.includes('لوڈنگ') ? slip.goods : `${slip.goods} لوڈنگ`;
    loadsBlock += `🟢 لوڈ نمبر 1\n${emoji1} مال: ${goods1}\n📍 روٹ: ${slip.loadingCity} ➔ ${slip.destinationCity}\n`;
    if (slip.loadingLocation && slip.loadingLocation !== slip.loadingCity) {
      loadsBlock += `📌 روانگی مقام: ${slip.loadingLocation}\n`;
    }
    if (slip.destinationLocation && slip.destinationLocation !== slip.destinationCity) {
      loadsBlock += `📌 ان لوڈنگ: ${slip.destinationLocation}\n`;
    }
    if (slip.quantity || slip.weight) {
      loadsBlock += `⚖️ وزن / مقدار: ${slip.quantity || slip.weight}\n`;
    }
    if (slip.vehicleType && slip.vehicleType !== 'Other') {
      loadsBlock += `🚚 گاڑی: ${slip.vehicleType}${slip.bodyType ? ` (${slip.bodyType})` : ''}\n`;
    }
    if (slip.fareOffer) {
      loadsBlock += `💰 کرایہ پیشکش: ${slip.fareOffer}\n`;
    }
    loadsBlock += '\n';

    // Additional Loads
    slip.additionalLoads!.forEach((al, idx) => {
      const emojiN = getCommodityEmoji(al.goods);
      const goodsN = al.goods.includes('لوڈنگ') ? al.goods : `${al.goods} لوڈنگ`;
      loadsBlock += `🟢 لوڈ نمبر ${idx + 2}\n${emojiN} مال: ${goodsN}\n📍 روٹ: ${al.loadingCity} ➔ ${al.destinationCity}\n`;
      if (al.quantity || al.weight) {
        loadsBlock += `⚖️ وزن / مقدار: ${al.quantity || al.weight}\n`;
      }
      if (al.vehicleType && al.vehicleType !== 'Other') {
        loadsBlock += `🚚 گاڑی: ${al.vehicleType}\n`;
      }
      loadsBlock += '\n';
    });
  } else {
    const emoji = getCommodityEmoji(slip.goods);
    const goods = slip.goods.includes('لوڈنگ') ? slip.goods : `${slip.goods} لوڈنگ`;
    loadsBlock += `${emoji} مال: ${goods}\n📍 روٹ: ${slip.loadingCity} ➔ ${slip.destinationCity}\n`;
    if (slip.loadingLocation && slip.loadingLocation !== slip.loadingCity) {
      loadsBlock += `📌 لوڈنگ پوائنٹ: ${slip.loadingLocation}\n`;
    }
    if (slip.destinationLocation && slip.destinationLocation !== slip.destinationCity) {
      loadsBlock += `📌 اترائی پوائنٹ: ${slip.destinationLocation}\n`;
    }
    if (slip.quantity || slip.weight) {
      loadsBlock += `⚖️ وزن / مقدار: ${slip.quantity || slip.weight}\n`;
    }
    if (slip.vehicleType && slip.vehicleType !== 'Other') {
      loadsBlock += `🚚 مطلوبہ گاڑی: ${slip.vehicleType}${slip.bodyType ? ` (${slip.bodyType})` : ''}\n`;
    }
    if (slip.vehicleNumber) {
      loadsBlock += `🔢 گاڑی نمبر: ${slip.vehicleNumber}\n`;
    }
    if (slip.fareOffer) {
      loadsBlock += `💰 کرایہ پیشکش: ${slip.fareOffer}\n`;
    }
    if (slip.specialInstructions) {
      loadsBlock += `📝 ہدایات / نوٹ: ${slip.specialInstructions}\n`;
    }
    loadsBlock += '\n';
  }

  // Unhide all contact phone numbers clearly
  let contactSection = '';
  if (slip.primaryPhone) {
    const mgr = slip.managerName ? ` (${slip.managerName})` : '';
    contactSection += `📞 رابطہ نمبر${mgr}: ${slip.primaryPhone}\n`;
  }
  if (slip.whatsappNumber && slip.whatsappNumber !== slip.primaryPhone) {
    contactSection += `💬 واٹس ایپ نمبر: ${slip.whatsappNumber}\n`;
  }
  if (slip.namedContacts && slip.namedContacts.length > 0) {
    slip.namedContacts.forEach((c) => {
      if (c && c.number && c.number !== slip.primaryPhone && c.number !== slip.whatsappNumber) {
        contactSection += `📞 رابطہ ${c.name ? `(${c.name})` : ''}: ${c.number}\n`;
      }
    });
  } else if (slip.additionalContacts && slip.additionalContacts.length > 0) {
    slip.additionalContacts.forEach((num, idx) => {
      if (num && num !== slip.primaryPhone && num !== slip.whatsappNumber) {
        contactSection += `📞 رابطہ نمبر ${idx + 2}: ${num}\n`;
      }
    });
  }

  return `🫡 السلام علیکم ورحمۃ اللہ وبرکاتہ 🫡
ایاک نعبد و ایاک نستعین

🚛 PK CARGO LINK — لائیو لوڈ سلپ 🚛
📋 سلپ نمبر: #${slip.id}

${loadsBlock}🏢 اڈا / کمپنی: ${slip.addaName}${slip.addaCity ? ` (${slip.addaCity})` : ''}
${contactSection}
🔗 مکمل ڈیجیٹل سلپ آن لائن دیکھیں:
${slipUrl}

✨ تصدیق شدہ پاکستان ڈیجیٹل لوڈ نیٹ ورک ✨`;
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

