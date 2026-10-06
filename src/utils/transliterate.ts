// Urdu (Perso-Arabic) -> Devanagari transliteration for speech synthesis.
//
// The chat text stays in Urdu, but the Hindi TTS voice pronounces Devanagari
// far more accurately than Perso-Arabic script. So before speaking, the bot's
// Urdu text is converted with this function. Display text is never changed.

const DIGRAPHS: Array<[string, string]> = [
  ['بھ', 'भ'], ['پھ', 'फ'], ['تھ', 'थ'], ['ٹھ', 'ठ'],
  ['جھ', 'झ'], ['چھ', 'छ'], ['دھ', 'ध'], ['ڈھ', 'ढ'],
  ['گھ', 'घ'], ['کھ', 'ख'],
];

// Consonants that can take a matra (used for contextual و handling)
const DEV_CONSONANTS = new Set([
  'ब', 'प', 'त', 'ट', 'स', 'ज', 'च', 'ह', 'ख़', 'द', 'ड', 'ज़',
  'र', 'ड़', 'झ़', 'श', 'ग़', 'फ', 'क़', 'क', 'ग', 'ल', 'म', 'न',
  'भ', 'थ', 'ठ', 'झ', 'छ', 'ध', 'ढ', 'घ', 'ख',
]);

const URDU_VOWELS = new Set(['ا', 'آ', 'و', 'ی', 'ے', 'ع', 'ء']);

const CHAR_MAP: Record<string, string> = {
  'آ': 'आ',
  'ب': 'ब', 'پ': 'प', 'ت': 'त', 'ٹ': 'ट', 'ث': 'स',
  'ج': 'ज', 'چ': 'च', 'ح': 'ह', 'خ': 'ख़',
  'د': 'द', 'ڈ': 'ड', 'ذ': 'ज़',
  'ر': 'र', 'ڑ': 'ड़', 'ز': 'ज़', 'ژ': 'झ़',
  'س': 'स', 'ش': 'श', 'ص': 'स', 'ض': 'ज़', 'ط': 'त', 'ظ': 'ज़',
  'ع': 'अ', 'غ': 'ग़', 'ف': 'फ', 'ق': 'क़',
  'ک': 'क', 'گ': 'ग', 'ل': 'ल', 'م': 'म', 'ن': 'न', 'ں': 'ं',
  'ہ': 'ह', 'ھ': 'ह', 'ء': '',
  'ی': 'ि', 'ے': 'े', 'ئ': 'य', 'ؤ': 'व',
};

// High-frequency function words, hand-tuned for natural pronunciation
const WORD_FIXES: Record<string, string> = {
  'میں': 'मैं', 'ہیں': 'हैं', 'ہے': 'है', 'ہوں': 'हूं', 'ہو': 'हो',
  'کیا': 'क्या', 'کی': 'की', 'کا': 'का', 'کے': 'के', 'کو': 'को',
  'سے': 'से', 'نے': 'ने', 'پر': 'पर', 'تک': 'तक',
  'آپ': 'आप', 'یہ': 'ये', 'یہی': 'यही', 'وہ': 'वो',
  'بھیجیں': 'भेजें', 'لکھیں': 'लिखें', 'کریں': 'करें', 'دبائیں': 'दबाएं',
  'بولیں': 'बोलें', 'آئیں': 'आएं',
  // Common bot vocabulary
  'ڈرائیور': 'ड्राइवर', 'ڈرائیوروں': 'ड्राइवरों',
  'مینیجر': 'मैनेजर', 'اڈا': 'अड्डा', 'اڈے': 'अड्डे',
  'ٹرک': 'ट्रक', 'گاڑی': 'गाड़ी', 'لوڈ': 'लोड',
  'آمدید': 'आमदीद', 'خوش': 'ख़ुश',
};

export function urduToDevanagari(input: string): string {
  let text = input;
  for (const [u, d] of DIGRAPHS) {
    text = text.split(u).join(d);
  }

  return text.split(/(\s+)/).map((chunk) => {
    if (/^\s*$/.test(chunk) || chunk === '') return chunk;

    // Whole-word fixes first
    const bare = chunk.replace(/[.,!?؟:؛"“”'()]/g, '');
    if (WORD_FIXES[bare] !== undefined) {
      return chunk.replace(bare, WORD_FIXES[bare]);
    }

    let out = '';
    const chars = Array.from(chunk);
    // Last Devanagari consonant check (nukta-aware: ख़ is two code points)
    const prevIsConsonant = () => {
      if (out.endsWith('़')) return DEV_CONSONANTS.has(out.slice(-2));
      return DEV_CONSONANTS.has(out.slice(-1));
    };
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const prevUrdu = i > 0 ? chars[i - 1] : '';
      const nextUrdu = i + 1 < chars.length ? chars[i + 1] : '';

      if (ch === 'ا') {
        out += i === 0 ? 'अ' : 'ा';
        continue;
      }
      if (ch === 'و') {
        if (i === 0) { out += 'व'; continue; }
        out += prevIsConsonant() ? 'ो' : 'व';
        continue;
      }
      if (ch === 'ی') {
        // word-initial or consonantal ی between/after vowels -> य, else vowel matra
        if (i === 0 || URDU_VOWELS.has(prevUrdu)) { out += 'य'; continue; }
        const atEnd = nextUrdu === '' || /[\s.,!?؟:؛"“”'()]/.test(nextUrdu);
        out += atEnd ? 'ी' : 'ि';
        continue;
      }
      if (ch === 'ے') { out += 'े'; continue; }
      if (CHAR_MAP[ch] !== undefined) { out += CHAR_MAP[ch]; continue; }
      // Strip Arabic diacritics; keep Latin, digits, punctuation as-is
      if (/[\u064B-\u0652\u0670]/.test(ch)) continue;
      out += ch;
    }
    return out;
  }).join('');
}
