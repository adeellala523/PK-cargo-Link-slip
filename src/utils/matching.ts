/**
 * Load <-> Vehicle auto-matching engine.
 *
 * Matches a load slip against available trucks (and vice versa) using
 * normalized city names, preferred routes and vehicle-type compatibility.
 * Deployed 2026-10-06.
 */
import { LoadSlip, AvailableTruck } from '../types';
import { mapToUrduCity } from './location';

/** Normalize for comparison: strip zero-width/invisible chars, collapse spaces, map EN->UR. */
export function normalizeCity(s: string | undefined | null): string {
  if (!s) return '';
  const cleaned = s
    .replace(/[‌‍‎‏\uFEFF\u00A0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return mapToUrduCity(cleaned) || cleaned;
}

const TYPE_ALIASES: Record<string, string> = {
  'مزدا': 'mazda',
  'شاہزور': 'shahzor',
  'ٹرالہ': '22wheeler',
  'ٹرالر': '22wheeler',
  'trailer': '22wheeler',
  'trolley': '22wheeler',
  'ٹرالی': '22wheeler',
  'پکاپ': 'pickup',
  'پک اپ': 'pickup',
  'ڈمپر': 'dumper',
  'کنٹینر': 'container',
  'فورلینڈ': 'forland',
  'فوٹون': 'foton',
  'جیک': 'jac',
  'پورٹر': 'porter',
  'ہینو': 'hino',
  'اسوزو': 'isuzu',
  'بیڈفورڈ': 'bedford',
  'other': 'other',
  'دیگر': 'other',
};

function normType(t: string | undefined | null): string {
  const k = (t || '').toLowerCase().replace(/[\s\-_]/g, '');
  if (!k) return '';
  return TYPE_ALIASES[k] || k;
}

/**
 * Vehicle-type compatibility: exact (normalized) match wins.
 * An empty type on either side is a wildcard (unknown fits anything).
 */
export function vehicleTypeCompatible(loadType: string | undefined, truckType: string | undefined): boolean {
  const a = normType(loadType);
  const b = normType(truckType);
  if (!a || !b) return true;
  return a === b || a.includes(b) || b.includes(a);
}

export interface RankedTruck {
  truck: AvailableTruck;
  score: number;
}

export interface RankedLoad {
  load: LoadSlip;
  score: number;
}

/**
 * Find available trucks matching a load.
 * Rank: destination-city route match first, then type specificity.
 */
export function findMatchingTrucks(load: LoadSlip, trucks: AvailableTruck[]): AvailableTruck[] {
  const loadCity = normalizeCity(load.loadingCity);
  const destCity = normalizeCity(load.destinationCity);
  if (!loadCity) return [];

  const ranked: RankedTruck[] = [];
  for (const t of trucks) {
    if (t.status === 'booked') continue;
    if (normalizeCity(t.currentCity) !== loadCity) continue;
    if (!vehicleTypeCompatible(load.vehicleType, t.vehicleType)) continue;

    let score = 1;
    const route = normalizeCity(t.preferredRoute || '');
    if (route && destCity && route.includes(destCity)) score += 3;
    // Prefer trucks whose type was explicitly specified (stronger match)
    if (normType(t.vehicleType) && normType(load.vehicleType)) score += 1;
    ranked.push({ truck: t, score });
  }
  return ranked.sort((x, y) => y.score - x.score).map((r) => r.truck);
}

/**
 * Find active loads matching a truck (mirror of findMatchingTrucks).
 */
export function findMatchingLoads(truck: AvailableTruck, loads: LoadSlip[]): LoadSlip[] {
  const truckCity = normalizeCity(truck.currentCity);
  if (!truckCity) return [];
  const route = normalizeCity(truck.preferredRoute || '');

  const ranked: RankedLoad[] = [];
  for (const l of loads) {
    if (l.status !== 'active') continue;
    if (normalizeCity(l.loadingCity) !== truckCity) continue;
    if (!vehicleTypeCompatible(l.vehicleType, truck.vehicleType)) continue;

    let score = 1;
    const dest = normalizeCity(l.destinationCity);
    if (route && dest && route.includes(dest)) score += 3;
    if (normType(l.vehicleType) && normType(truck.vehicleType)) score += 1;
    ranked.push({ load: l, score });
  }
  return ranked.sort((x, y) => y.score - x.score).map((r) => r.load);
}
