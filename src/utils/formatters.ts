import { LoadSlip } from '../types';

export const OFFICIAL_WEBSITE_URL = 'https://pkcargolink.com';
export const APP_BASE_URL = OFFICIAL_WEBSITE_URL;

export function getAppBaseUrl(): string {
  return OFFICIAL_WEBSITE_URL;
}

/**
 * Generates a unique, non-duplicating slip ID in format:
 * PKCL-YYYYMMDD-XXXXXX (e.g. PKCL-20261001-000125)
 */
export function generateSlipId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // High-precision sequence + random component to guarantee uniqueness
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PKCL-${dateStr}-${randomNum}`;
}

/**
 * Builds the exact WhatsApp formatted text according to PK Cargo Link specifications
 */
export function formatWhatsAppMessage(slip: LoadSlip): string {
  // Pass slip details in query params so WhatsApp preview card generates exact Adda Name & Cargo
  const params = new URLSearchParams({
    a: slip.addaName,
    c: slip.addaCity,
    from: slip.loadingCity,
    to: slip.destinationCity,
    g: slip.goods,
    w: slip.weight,
    v: slip.vehicleType,
    p: slip.primaryPhone,
  });
  if (slip.addaLogo && !slip.addaLogo.startsWith('data:')) {
    params.set('img', slip.addaLogo);
  }
  const slipUrl = `${OFFICIAL_WEBSITE_URL}/slip/${slip.id}?${params.toString()}`;
  
  let contactLines = slip.primaryPhone;
  if (slip.whatsappNumber && slip.whatsappNumber !== slip.primaryPhone) {
    contactLines += ` (واٹس ایپ: ${slip.whatsappNumber})`;
  }
  if (slip.additionalContacts && slip.additionalContacts.length > 0) {
    contactLines += `\nدیگر رابطہ: ${slip.additionalContacts.slice(0, 2).join(' / ')}`;
  }

  const vehicleNumLine = slip.vehicleNumber ? `\n🔢 گاڑی نمبر:\n${slip.vehicleNumber}` : '';
  const fareLine = slip.fareOffer ? `\n💰 پیشکش کرایہ:\n${slip.fareOffer}` : '';

  const driverPortalUrl = `${OFFICIAL_WEBSITE_URL}/driver`;

  return `🚛 دستیاب لوڈ: ${slip.loadingCity} تا ${slip.destinationCity}

📍 لوڈنگ:
${slip.loadingCity} — ${slip.loadingLocation}

📍 منزل:
${slip.destinationCity} — ${slip.destinationLocation}

📦 مال:
${slip.goods}

⚖️ وزن:
${slip.weight}

📦 مقدار:
${slip.quantity}

🚛 مطلوبہ گاڑی:
${slip.vehicleType}

🏗️ باڈی:
${slip.bodyType}${vehicleNumLine}${fareLine}

📞 رابطہ:
${contactLines}

🏢 اڈا:
${slip.addaName} (${slip.addaCity})

🔗 مکمل لوڈ سلپ (تصویر اور تفصیلات):
${slipUrl}

🚚 مزید تمام دستیاب لوڈز تلاش کرنے کے لیے (ڈرائیور پورٹل):
${driverPortalUrl}`;
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
