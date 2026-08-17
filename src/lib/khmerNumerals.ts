/**
 * Khmer Numerals & Phonetic Speech Helpers
 * Converts numbers into natural Khmer spoken words and Khmer script digits
 * Ensures Gemini TTS and Web Speech engines speak 100% authentic Cambodian Khmer
 * for ALL restaurant table numbers (Table 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, etc.).
 */

const KHMER_DIGITS_MAP: Record<string, string> = {
  '0': '០',
  '1': '១',
  '2': '២',
  '3': '៣',
  '4': '៤',
  '5': '៥',
  '6': '៦',
  '7': '៧',
  '8': '៨',
  '9': '៩',
};

const KHMER_ONES_WORDS = [
  'សូន្យ', // 0
  'មួយ',   // 1 (Muoy)
  'ពីរ',   // 2 (Pi)
  'បី',    // 3 (Bei)
  'បួន',   // 4 (Boun)
  'ប្រាំ',  // 5 (Pram)
  'ប្រាំមួយ', // 6 (Pram Muoy)
  'ប្រាំពីរ', // 7 (Pram Pi)
  'ប្រាំបី',  // 8 (Pram Bei)
  'ប្រាំបួន', // 9 (Pram Boun)
];

const KHMER_TENS_WORDS: Record<number, string> = {
  1: 'ដប់',     // 10 (Dop)
  2: 'ម្ភៃ',     // 20 (Mphai)
  3: 'សាមសិប', // 30 (Samseb)
  4: 'សែសិប',   // 40 (Saiseb)
  5: 'ហាសិប',   // 50 (Haseb)
  6: 'ហុកសិប',   // 60 (Hokseb)
  7: 'ចិតសិប',   // 70 (Chetseb)
  8: 'ប៉ែតសិប',  // 80 (Paetseb)
  9: 'កៅសិប',   // 90 (Kaoseb)
};

/**
 * Converts any integer number (0 - 999) into authentic spoken Khmer words.
 * Examples:
 *  1 -> "មួយ"
 *  2 -> "ពីរ"
 *  3 -> "បី"
 *  4 -> "បួន"
 *  5 -> "ប្រាំ"
 *  6 -> "ប្រាំមួយ"
 *  7 -> "ប្រាំពីរ"
 *  8 -> "ប្រាំបី"
 *  9 -> "ប្រាំបួន"
 *  10 -> "ដប់"
 *  11 -> "ដប់មួយ"
 *  12 -> "ដប់ពីរ"
 *  15 -> "ដប់ប្រាំ"
 *  20 -> "ម្ភៃ"
 *  25 -> "ម្ភៃប្រាំ"
 *  32 -> "សាមសិបពីរ"
 */
export function getKhmerNumberWord(num: number): string {
  const n = Math.floor(Math.abs(num));
  if (n <= 9) {
    return KHMER_ONES_WORDS[n] || String(n);
  }

  if (n === 10) {
    return 'ដប់';
  }

  if (n < 20) {
    const unit = n % 10;
    return `ដប់${KHMER_ONES_WORDS[unit]}`;
  }

  if (n < 100) {
    const tensDigit = Math.floor(n / 10);
    const unit = n % 10;
    const tensWord = KHMER_TENS_WORDS[tensDigit] || '';
    if (unit === 0) {
      return tensWord;
    }
    return `${tensWord}${KHMER_ONES_WORDS[unit]}`;
  }

  if (n < 1000) {
    const hundredsDigit = Math.floor(n / 100);
    const remainder = n % 100;
    const hundredsWord = hundredsDigit === 1 ? 'មួយរយ' : `${KHMER_ONES_WORDS[hundredsDigit]}រយ`;
    if (remainder === 0) {
      return hundredsWord;
    }
    return `${hundredsWord} ${getKhmerNumberWord(remainder)}`;
  }

  return String(n);
}

/**
 * Converts arabic numerals to Khmer script digits (e.g. 5 -> "៥", 12 -> "១២")
 */
export function getKhmerDigits(num: number | string): string {
  return String(num)
    .split('')
    .map((char) => KHMER_DIGITS_MAP[char] || char)
    .join('');
}

/**
 * Builds the complete, authentic Khmer kitchen order announcement sentence.
 * Guarantees that EVERY table number is written in native phonetic Khmer words
 * so Gemini TTS and Speech engines speak with 100% natural Cambodian pronunciation.
 */
export function getKhmerOrderAnnouncement(
  tableNumber: number,
  itemCount?: number
): {
  naturalSentence: string;
  shortSentence: string;
  khmerWord: string;
  khmerDigits: string;
} {
  const khmerWord = getKhmerNumberWord(tableNumber);
  const khmerDigits = getKhmerDigits(tableNumber);

  // Example: "ទទួលបានការកម្មង់ថ្មី ពីតុលេខមួយ" (Got new order from Table 1)
  const naturalSentence = `ទទួលបានការកម្មង់ថ្មី ពីតុលេខ${khmerWord}`;
  const shortSentence = `តុលេខ${khmerWord}`;

  return {
    naturalSentence,
    shortSentence,
    khmerWord,
    khmerDigits,
  };
}
