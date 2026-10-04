// Utility normalizer for Pakistani Transport terms (Urdu, Roman Urdu, Punjabi, English)

export const VEHICLE_TERM_MAP: Record<string, string> = {
  '22 wheeler': '22 Wheeler',
  '22-wheeler': '22 Wheeler',
  '22 ویلر': '22 Wheeler',
  'بائیس ویلر': '22 Wheeler',
  '10 wheeler': '10 Wheeler',
  '10-wheeler': '10 Wheeler',
  '10 ویلر': '10 Wheeler',
  'دس ویلر': '10 Wheeler',
  'shahzor': 'Shahzor',
  'شهزور': 'Shahzor',
  'شاہزور': 'Shahzor',
  'jac': 'JAC',
  'جیک': 'JAC',
  'جے اے سی': 'JAC',
  'porter': 'Porter',
  'پورٹر': 'Porter',
  'mazda': 'Mazda',
  'مزدا': 'Mazda',
  'مزدہ': 'Mazda',
  'container': '40 Foot Container',
  'کنٹینر': '40 Foot Container',
  '40 foot': '40 Foot Container',
  '40 فٹ': '40 Foot Container',
  '16 foot': '16 Foot',
  '16 فٹ': '16 Foot',
  '18 foot': '18 Foot',
  '18 فٹ': '18 Foot',
  '20 foot': '20 Foot',
  '20 فٹ': '20 Foot',
};

export function normalizeVehicleType(input: string): string {
  if (!input) return '';
  const lower = input.toLowerCase().trim();
  for (const [key, val] of Object.entries(VEHICLE_TERM_MAP)) {
    if (lower.includes(key)) {
      return val;
    }
  }
  return input;
}

export function extractPakistaniCities(text: string): { fromCity: string; toCity: string } {
  const PAK_CITIES = [
    'لاہور', 'کراچی', 'ملتان', 'فیصل آباد', 'راولپنڈی', 'اسلام آباد', 'پشاور', 'کوئٹہ',
    'گوجرانوالہ', 'سیالکوٹ', 'رحیم یار خان', 'سکھر', 'حیدرآباد', 'صادق آباد', 'بہاولپور',
    'سرگودھا', 'گجرات', 'مردان', 'اوکاڑہ', 'خانیوال', 'ساہیوال', 'شیخوپورہ', 'پتوکی',
    'lahore', 'karachi', 'multan', 'faisalabad', 'rawalpindi', 'islamabad', 'peshawar', 'quetta',
    'sukkur', 'hyderabad', 'sialkot', 'gujranwala', 'okara', 'sahiwal', 'khanewal'
  ];

  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const city of PAK_CITIES) {
    if (lower.includes(city.toLowerCase())) {
      // Map English to Urdu name
      let urduName = city;
      if (city === 'lahore') urduName = 'لاہور';
      if (city === 'karachi') urduName = 'کراچی';
      if (city === 'multan') urduName = 'ملتان';
      if (city === 'faisalabad') urduName = 'فیصل آباد';
      if (city === 'rawalpindi') urduName = 'راولپنڈی';
      if (city === 'islamabad') urduName = 'اسلام آباد';
      if (city === 'peshawar') urduName = 'پشاور';
      if (city === 'quetta') urduName = 'کوئٹہ';
      if (city === 'sukkur') urduName = 'سکھر';
      if (city === 'hyderabad') urduName = 'حیدرآباد';
      if (city === 'sialkot') urduName = 'سیالکوٹ';
      if (city === 'gujranwala') urduName = 'گوجرانوالہ';

      if (!found.includes(urduName)) {
        found.push(urduName);
      }
    }
  }

  return {
    fromCity: found[0] || '',
    toCity: found[1] || '',
  };
}
