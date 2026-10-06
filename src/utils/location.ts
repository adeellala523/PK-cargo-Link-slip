/**
 * User location utilities — detect the visitor's city via browser geolocation
 * and reverse-geocoding, so the homepage can show loads from their own city.
 */

const CITY_KEY = 'pkcl_user_city';
const DISMISS_KEY = 'pkcl_location_dismissed';

/** English (reverse-geocode) -> Urdu (website) city names */
export const CITY_EN_TO_UR: Record<string, string> = {
  'arifwala': 'عارف والا', 'bagh chowk': 'باغ چوک', 'bahawalnagar': 'بہاولنگر',
  'bahawalpur': 'بہاولپور', 'begpur': 'بیگ پور', 'bhakkar': 'بھکر',
  'bonga hayat': 'بونگا حیات', 'bulle shah': 'بلے شاہ', 'burewala': 'بورے والا',
  'chak jhumra': 'چک جھمرہ', 'chakwal': 'چکوال', 'chichawatni': 'چیچہ وطنی',
  'chiniot': 'چنیوٹ', 'chowk azam': 'چوک اعظم', 'dera ghazi khan': 'ڈیرہ غازی خان',
  'faisalabad': 'فیصل آباد', 'faqirwala': 'فقیر والا', 'farooqabad': 'فاروق آباد',
  'fazilpur': 'فاضل پور', 'feroz wattwan': 'فروز وٹواں', 'fort abbas': 'فورٹ عباس',
  'ghakhar mandi': 'گکھڑ منڈی', 'gujranwala': 'گوجرانوالہ', 'gujrat': 'گجرات',
  'haripur': 'ہری پور', 'haroonabad': 'ہارون آباد', 'havelian': 'حویلیاں',
  'hyderabad': 'حیدرآباد', 'islamabad': 'اسلام آباد', 'jhang': 'جھنگ',
  'jhelum': 'جہلم', 'kabirwala': 'کبیروالا', 'kalurkot': 'کلورکوٹ',
  'kamalia': 'کمالیہ', 'karachi': 'کراچی', 'kasur': 'قصور',
  'khanewal': 'خانیوال', 'khanqah sirajia': 'خانقاہ سراجیہ', 'kot sultan': 'کوٹ سلطان',
  'lahore': 'لاہور', 'layyah': 'لیہ', 'marot': 'مروٹ', 'mian channu': 'میاں چنوں',
  'mianwali': 'میانوالی', 'multan': 'ملتان', 'muzaffargarh': 'مظفرگڑھ',
  'nankana sahib': 'ننکانہ صاحب', 'nowshera virkan': 'نوشہرہ ورکاں',
  'okara': 'اوکاڑہ', 'peshawar': 'پشاور', 'pindi bhattian': 'پنڈی بھٹیاں',
  'punjab': 'پنجاب', 'quetta': 'کوئٹہ', 'raiwind': 'رائیونڈ', 'rajana': 'رجانہ',
  'rawalpindi': 'راولپنڈی', 'sahianwala': 'ساہیانوالا', 'sahiwal': 'ساہیوال',
  'sargodha': 'سرگودھا', 'shahkot': 'شاہ کوٹ', 'sialkot': 'سیالکوٹ',
  'sindh': 'سندھ', 'sukkur': 'سکھر', 'toba tek singh': 'ٹوبہ ٹیک سنگھ',
  'vehari': 'وہاڑی', 'wah cantt': 'واہ کینٹ', 'wan bhachran': 'واں بھچراں',
};

function normCity(c: string): string {
  return c.trim().toLowerCase().replace(/[\s\-']/g, '');
}

export function mapToUrduCity(englishName: string): string | null {
  const key = normCity(englishName);
  for (const [en, ur] of Object.entries(CITY_EN_TO_UR)) {
    if (normCity(en) === key) return ur;
  }
  // Try partial match (e.g. "Lahore District" -> "Lahore")
  for (const [en, ur] of Object.entries(CITY_EN_TO_UR)) {
    const nEn = normCity(en);
    if (nEn.length > 3 && (key.includes(nEn) || nEn.includes(key))) return ur;
  }
  return null;
}

export function getStoredCity(): string | null {
  try {
    return localStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}

export function saveCity(cityUrdu: string): void {
  try {
    localStorage.setItem(CITY_KEY, cityUrdu);
    localStorage.removeItem(DISMISS_KEY);
  } catch {}
}

export function clearCity(): void {
  try {
    localStorage.removeItem(CITY_KEY);
  } catch {}
}

export function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissPrompt(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {}
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('geolocation-unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 600000,
    });
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // Prefer city, then locality, then subdivision
    return data.city || data.locality || data.principalSubdivision || null;
  } catch {
    return null;
  }
}

/**
 * Full flow: ask browser for location, reverse-geocode to an English city name,
 * map it to the Urdu name used on the website. Returns null on any failure.
 */
export async function detectUserCity(): Promise<string | null> {
  try {
    const pos = await getPosition();
    const englishCity = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    if (!englishCity) return null;
    return mapToUrduCity(englishCity);
  } catch {
    return null;
  }
}
