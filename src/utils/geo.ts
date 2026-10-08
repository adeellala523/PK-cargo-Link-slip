/**
 * geo.ts — distance helpers for driver proximity filtering.
 *
 * Rule (Adeel — Yango-style): drivers see ONLY loads whose pickup point is
 * within 7 km of their CURRENT GPS location, sorted nearest-first.
 */

/** Driver visibility radius in km */
export const DRIVER_NEARBY_KM = 7;

/** Haversine distance between two GPS points, in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** "3.2 km دور" style badge text */
export function formatDistanceKm(km: number): string {
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${rounded} km دور`;
}

/**
 * Forward-geocode a Pakistani city name to GPS coordinates.
 * Uses OpenStreetMap Nominatim (free, no API key). Rate limit ~1 req/sec —
 * fine for slip creation (infrequent). Returns null on failure.
 */
export async function geocodeCity(
  cityName: string
): Promise<{ lat: number; lng: number } | null> {
  const q = (cityName || '').trim();
  if (!q) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
      `&countrycodes=pk&q=${encodeURIComponent(q + ', Pakistan')}`;
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    // Sanity: must be inside Pakistan's rough bounding box
    if (lat < 23 || lat > 38 || lng < 60 || lng > 78) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/** Do two vehicle-type strings match? (case-insensitive; empty = open to all) */
export function vehicleTypesMatch(
  slipVehicleType: string | undefined,
  driverVehicleType: string | undefined
): boolean {
  const s = (slipVehicleType || '').trim().toLowerCase();
  const d = (driverVehicleType || '').trim().toLowerCase();
  if (!s || !d) return true; // unspecified on either side = no restriction
  // Support multi-value slip types separated by ، or ,
  const parts = s.split(/[،,]/).map((p) => p.trim()).filter(Boolean);
  return parts.includes(d);
}
