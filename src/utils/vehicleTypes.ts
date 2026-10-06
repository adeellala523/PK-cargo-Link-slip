// Comprehensive list of cargo vehicle types used across Pakistan.
// Shared by the chatbot, load creation forms, truck listings and admin tools
// so every surface offers the same complete set.

export interface VehicleTypeOption {
  /** Latin identifier stored in slips / truck records */
  value: string;
  /** Urdu display label */
  urdu: string;
}

export const PAKISTAN_VEHICLE_TYPES: VehicleTypeOption[] = [
  // Most common first
  { value: '22 Wheeler', urdu: '22 وہیلر / ٹرالہ' },
  { value: '10 Wheeler', urdu: '10 وہیلر' },
  { value: 'Shahzor', urdu: 'شاہزور' },
  { value: 'Mazda', urdu: 'مزدا' },
  { value: 'Suzuki Pickup', urdu: 'سوزوکی پک اپ' },
  { value: 'Porter', urdu: 'پورٹر' },
  { value: 'JAC', urdu: 'جیک' },
  { value: 'Forland', urdu: 'فور لینڈ' },
  { value: 'Foton', urdu: 'فوٹون' },
  { value: 'Loader Rickshaw', urdu: 'لوڈر رکشہ' },
  // Mazda body sizes
  { value: 'Mazda 16 Foot', urdu: 'مزدا 16 فٹ' },
  { value: 'Mazda 18 Foot', urdu: 'مزدا 18 فٹ' },
  { value: 'Mazda 20 Foot', urdu: 'مزدا 20 فٹ' },
  // Wheeler series
  { value: '4 Wheeler', urdu: '4 وہیلر' },
  { value: '6 Wheeler', urdu: '6 وہیلر' },
  { value: '8 Wheeler', urdu: '8 وہیلر' },
  { value: '12 Wheeler', urdu: '12 وہیلر' },
  { value: '14 Wheeler', urdu: '14 وہیلر' },
  { value: '16 Wheeler', urdu: '16 وہیلر' },
  { value: '18 Wheeler', urdu: '18 وہیلر' },
  // Popular truck brands
  { value: 'Bedford', urdu: 'بیڈ فورڈ' },
  { value: 'Hino', urdu: 'ہینو' },
  { value: 'Isuzu', urdu: 'اسوزو' },
  // Body lengths
  { value: '16 Foot', urdu: '16 فٹ' },
  { value: '18 Foot', urdu: '18 فٹ' },
  { value: '20 Foot', urdu: '20 فٹ' },
  { value: '24 Foot', urdu: '24 فٹ' },
  { value: '32 Foot', urdu: '32 فٹ' },
  { value: '40 Foot', urdu: '40 فٹ' },
  // Containers
  { value: '20 Foot Container', urdu: '20 فٹ کنٹینر' },
  { value: '40 Foot Container', urdu: '40 فٹ کنٹینر' },
  // Trailers & special
  { value: 'Flatbed Trailer', urdu: 'فلیٹ بیڈ ٹرالہ' },
  { value: 'Lowbed Trailer', urdu: 'لو بیڈ ٹرالہ' },
  { value: 'Oil Tanker', urdu: 'آئل ٹینکر' },
  { value: 'Water Tanker', urdu: 'واٹر ٹینکر' },
  { value: 'Dumper', urdu: 'ڈمپر' },
  { value: 'Crane Truck', urdu: 'کرین ٹرک' },
  { value: 'Refrigerated Truck', urdu: 'ریفریجریٹڈ ٹرک' },
  { value: 'Box Truck', urdu: 'باکس ٹرک' },
  { value: 'Trolley', urdu: 'ٹرالی' },
  { value: 'Other', urdu: 'دیگر' },
];

/** Plain Latin values, handy for dropdowns and selects. */
export const PAKISTAN_VEHICLE_VALUES: string[] = PAKISTAN_VEHICLE_TYPES.map((v) => v.value);

/**
 * Match free text (Latin or Urdu, typed or from speech recognition)
 * to a vehicle type value. Longest Latin match wins so
 * "mazda 16 foot" beats the generic "mazda".
 */
export function matchVehicleType(text: string): string | null {
  const lower = (text || '').toLowerCase().trim();
  if (!lower) return null;
  const urduHit = PAKISTAN_VEHICLE_TYPES.find((v) => lower.includes(v.urdu));
  if (urduHit) return urduHit.value;
  const sorted = [...PAKISTAN_VEHICLE_VALUES].sort((a, b) => b.length - a.length);
  const latinHit = sorted.find((v) => lower.includes(v.toLowerCase()));
  if (latinHit) return latinHit;
  if (lower.length >= 2) {
    const partial = sorted.find((v) => v.toLowerCase().includes(lower));
    if (partial) return partial;
  }
  return null;
}
