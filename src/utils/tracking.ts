/**
 * tracking.ts — client helpers for live truck tracking (Yango-style).
 * Driver app POSTs GPS every 30s while sharing; adda side polls every 30s.
 */

export interface TrackingPoint {
  slipId: string;
  lat: number;
  lng: number;
  driverPhone: string;
  driverName: string;
  tripStatus: string;
  updatedAt: string;
}

const ENDPOINT = '/api/tracking.php';
const SHARE_KEY = 'pkcl_tracking_share'; // slipId -> '1'

export function isSharingFor(slipId: string): boolean {
  try {
    return localStorage.getItem(`${SHARE_KEY}:${slipId}`) === '1';
  } catch {
    return false;
  }
}

function setSharingFor(slipId: string, on: boolean) {
  try {
    if (on) localStorage.setItem(`${SHARE_KEY}:${slipId}`, '1');
    else localStorage.removeItem(`${SHARE_KEY}:${slipId}`);
  } catch { /* ignore */ }
}

/** Driver: push one GPS fix to the server */
export async function pushLocation(opts: {
  slipId: string;
  lat: number;
  lng: number;
  driverPhone: string;
  driverName: string;
  tripStatus?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...opts, sharing: true }),
    });
    const j = await res.json().catch(() => ({}));
    return res.ok && (j as { ok?: boolean }).ok === true;
  } catch {
    return false;
  }
}

/** Driver: stop sharing (toggle OFF or load done) */
export async function stopSharing(slipId: string): Promise<void> {
  setSharingFor(slipId, false);
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slipId, sharing: false }),
    });
  } catch { /* ignore */ }
}

export function markSharingOn(slipId: string) {
  setSharingFor(slipId, true);
}

/** Adda: fetch latest position for one load */
export async function fetchTracking(slipId: string): Promise<TrackingPoint | null> {
  try {
    const res = await fetch(`${ENDPOINT}?action=get&slipId=${encodeURIComponent(slipId)}`);
    if (!res.ok) return null;
    const j = (await res.json()) as { ok?: boolean; tracking?: TrackingPoint | null };
    return j.ok ? j.tracking || null : null;
  } catch {
    return null;
  }
}

/** Promise-based one-shot geolocation */
export function getCurrentPosition(timeoutMs = 12000): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('geolocation unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 }
    );
  });
}

/**
 * OSM embed URL for a live map with truck marker.
 * No API key needed (OpenStreetMap).
 */
export function osmEmbedUrl(lat: number, lng: number, zoom = 13): string {
  const d = 0.06 / Math.pow(2, Math.max(0, zoom - 13));
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

/** "x min ago" in Urdu for the freshness label */
export function trackingAge(iso: string): string {
  try {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'ابھی اپ ڈیٹ ہوئی';
    if (mins === 1) return '1 منٹ پہلے';
    if (mins < 60) return `${mins} منٹ پہلے`;
    return `${Math.floor(mins / 60)} گھنٹے پہلے`;
  } catch {
    return '';
  }
}
