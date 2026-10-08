/**
 * Verification (KYC) utilities — mandatory driver/adda verification like Yango/InDrive.
 * Unverified users can browse but CANNOT post loads or list vehicles.
 */
import type { UserAccount } from '../types';
import { StorageService } from '../services/storage';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type UserRole = 'driver' | 'adda_manager';

export interface VerificationDocDef {
  key: 'driverLicenseUrl' | 'numberPlateUrl' | 'cnicUrl' | 'addaPhotoUrl' | 'addaLocation';
  label: string;       // Urdu label
  hint: string;        // Urdu hint
  icon: string;        // emoji
}

/** Required documents per role */
export const REQUIRED_DOCS: Record<UserRole, VerificationDocDef[]> = {
  driver: [
    { key: 'driverLicenseUrl', label: 'ڈرائیونگ لائسنس', hint: 'لائسنس کی واضح تصویر لیں', icon: '🪪' },
    { key: 'numberPlateUrl', label: 'گاڑی کی نمبر پلیٹ', hint: 'نمبر پلیٹ کی واضح تصویر لیں', icon: '🔢' },
    { key: 'cnicUrl', label: 'شناختی کارڈ (فرنٹ)', hint: 'شناختی کارڈ کے سامنے والی سائیڈ کی تصویر', icon: '🆔' },
  ],
  adda_manager: [
    { key: 'cnicUrl', label: 'شناختی کارڈ (فرنٹ)', hint: 'شناختی کارڈ کے سامنے والی سائیڈ کی تصویر', icon: '🆔' },
    { key: 'addaLocation', label: 'اڈے کی لوکیشن', hint: 'نقشے پر اڈے کی جگہ منتخب کریں', icon: '📍' },
    { key: 'addaPhotoUrl', label: 'اڈے کی تصویر', hint: 'اڈے/آفس کی باہر سے واضح تصویر', icon: '🏢' },
  ],
};

export function getVerificationStatus(user: UserAccount | null | undefined): VerificationStatus {
  if (!user) return 'unverified';
  return user.verificationStatus || 'unverified';
}

export function isVerified(user: UserAccount | null | undefined): boolean {
  return getVerificationStatus(user) === 'verified';
}

export function isVerificationPending(user: UserAccount | null | undefined): boolean {
  return getVerificationStatus(user) === 'pending';
}

export function isVerificationRejected(user: UserAccount | null | undefined): boolean {
  return getVerificationStatus(user) === 'rejected';
}

/** All required docs present for the user's role? */
export function hasAllRequiredDocs(user: UserAccount): boolean {
  const role: UserRole = user.role === 'driver' ? 'driver' : 'adda_manager';
  const docs = user.verificationDocs || {};
  return REQUIRED_DOCS[role].every((d) => {
    if (d.key === 'addaLocation') {
      return typeof docs.addaLocationLat === 'number' && typeof docs.addaLocationLng === 'number';
    }
    return Boolean(docs[d.key as 'driverLicenseUrl' | 'numberPlateUrl' | 'cnicUrl' | 'addaPhotoUrl']);
  });
}

/** Missing doc labels for the user's role (Urdu) */
export function missingDocs(user: UserAccount): string[] {
  const role: UserRole = user.role === 'driver' ? 'driver' : 'adda_manager';
  const docs = user.verificationDocs || {};
  return REQUIRED_DOCS[role]
    .filter((d) => {
      if (d.key === 'addaLocation') {
        return !(typeof docs.addaLocationLat === 'number' && typeof docs.addaLocationLng === 'number');
      }
      return !docs[d.key as 'driverLicenseUrl' | 'numberPlateUrl' | 'cnicUrl' | 'addaPhotoUrl'];
    })
    .map((d) => d.label);
}

/** Gate: can this user post loads / list vehicles? */
export function canPost(user: UserAccount | null | undefined): boolean {
  return isVerified(user);
}

/** Urdu status label */
export function verificationStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'verified': return 'تصدیق شدہ';
    case 'pending': return 'زیر جائزہ';
    case 'rejected': return 'مسترد';
    default: return 'غیر تصدیق شدہ';
  }
}

/**
 * Upload a verification photo to the server (api/upload.php).
 * Tries multipart upload first, falls back to base64 JSON.
 * Returns the public URL. Compresses the image client-side to keep uploads small.
 */
export async function uploadVerificationPhoto(file: File): Promise<string> {
  const compressed = await compressImage(file, 1280, 0.82);

  // Try multipart first
  try {
    const form = new FormData();
    form.append('image', compressed, 'verify.jpg');
    const res = await fetch('/api/upload.php', { method: 'POST', body: form });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.url) return json.url as string;
    }
  } catch { /* fall through to base64 */ }

  // Fallback: base64 JSON
  const dataUrl = await fileToDataUrl(compressed);
  const res = await fetch('/api/upload.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: dataUrl }),
  });
  const json = await res.json();
  if (json && json.success && json.url) return json.url as string;
  throw new Error('اپ لوڈ ناکام ہوئی — دوبارہ کوشش کریں');
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Downscale large photos so uploads stay fast on mobile data */
function compressImage(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas');
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('compress'))),
          'image/jpeg',
          quality
        );
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load'));
    };
    img.src = url;
  });
}

/** Google Maps link for an adda location pin */
export function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Urdu message explaining why posting is blocked, or null if allowed */
export function getPostingBlockReason(user: UserAccount | null | undefined): string | null {
  const s = getVerificationStatus(user);
  if (s === 'verified') return null;
  if (s === 'pending')
    return 'آپ کی تصدیق زیر جائزہ ہے — ایڈمن کی منظوری کے بعد پوسٹ کر سکیں گے۔';
  if (s === 'rejected')
    return 'آپ کی تصدیق مسترد ہو گئی ہے — درست دستاویزات دوبارہ اپ لوڈ کریں۔';
  return 'پہلے تصدیق مکمل کریں — لوڈ/گاڑی پوسٹ کرنے کے لیے تصدیق لازمی ہے۔';
}

const cleanPhone = (p: string) => (p || '').replace(/[^0-9]/g, '');

/**
 * Find the UserAccount backing the current session (by phone), creating a
 * minimal one if needed so verification docs always have a home.
 */
export function resolveVerificationUser(
  phone: string,
  role: UserRole,
  profile?: { addaName?: string; managerName?: string; city?: string; address?: string; whatsappNumber?: string }
): UserAccount | null {
  const cp = cleanPhone(phone);
  if (!cp) return null;
  const users = StorageService.getUsers();
  const found = users.find((u) => cleanPhone(u.phone) === cp || cleanPhone(u.whatsappNumber) === cp);
  if (found) {
    // Backfill role if missing
    if (!found.role) {
      const updated = { ...found, role };
      saveVerificationUser(updated);
      return updated;
    }
    return found;
  }
  const fresh: UserAccount = {
    id: `user_${Date.now()}`,
    phone: phone.trim(),
    role,
    addaName: profile?.addaName || '',
    managerName: profile?.managerName || '',
    city: profile?.city || '',
    address: profile?.address || '',
    whatsappNumber: profile?.whatsappNumber || phone.trim(),
    status: 'active',
    subscriptionPlan: 'monthly',
    isApprovedByAdmin: false,
    createdAt: new Date().toISOString(),
    verificationStatus: 'unverified',
  };
  saveVerificationUser(fresh);
  return fresh;
}

/** Persist a verification user (local + server sync, fire-and-forget server) */
export async function saveVerificationUser(updated: UserAccount): Promise<void> {
  const users = StorageService.getUsers();
  const cp = cleanPhone(updated.phone);
  const idx = users.findIndex((u) => cleanPhone(u.phone) === cp);
  const next = idx >= 0
    ? users.map((u, i) => (i === idx ? updated : u))
    : [...users, updated];
  await StorageService.saveUsers(next);
}
