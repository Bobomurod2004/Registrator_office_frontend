/**
 * O'zbek lotin -> kirill transliteratsiyasi.
 *
 * Interfeys matnlari faqat lotin alifbosida ("uz" obyekti) qo'lda yoziladi;
 * kirill varianti shundan avtomatik hosil qilinadi — shu sababli ikkalasi
 * har doim sinxron qoladi (lotin matn o'zgarsa, kirill ham avtomatik yangilanadi).
 * Rasmiy lotin-kirill mos jadvaliga asoslangan qoidaviy (algoritmik)
 * almashtirish — murakkab/nostandart so'zlar uchun 100% aynan mos kelmasligi
 * mumkin, lekin interfeys matnlari uchun yetarlicha aniq.
 */

// Brend/qisqartma nomlar — harflab emas, aynan o'zi qoldiriladi.
const PROTECTED_TERMS = [
  'employee_id_number',
  'email@example.com',
  'HEMIS ID',
  'HEMIS',
  'OneID',
  'JSHSHIR',
  'SuperAdmin',
  'REF-01',
  'PDF',
  'CSV',
  'SLA',
  'GPA',
  'KPI',
  'URL',
  'Excel',
  'Email',
  'ID',
  'IP',
]

// Matnda uchramaydigan belgi — himoyalangan atamalarni vaqtincha almashtirish
// uchun marker sifatida (oddiy raqamlar bilan chalkashib ketmasligi uchun).
const TOKEN_MARK = String.fromCharCode(167) // '§'
const TOKEN_PATTERN = new RegExp(TOKEN_MARK + '(\\d+)' + TOKEN_MARK, 'g')

const APOSTROPHES = /['ʻ‘’`´]/g

const CONSONANT_DIGRAPHS: Array<[string, string]> = [
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['yo', 'ё'],
  ['yu', 'ю'],
  ['ya', 'я'],
  ['ye', 'е'],
]

const SINGLE_LOWER: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к',
  l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т',
  u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', c: 'к', w: 'в',
}

const CYR_VOWELS = 'АЕЁИОУЎЭЮЯаеёиоуўэюя'
const LAT_VOWELS = 'AEIOUaeiou'
const CYR_CONSONANTS = 'БВГҒДЖЗЙКЛМНПҚРСТФХҲЦЧШбвгғджзйклмнпқрстфхҳцчш'

function isVowelChar(ch: string): boolean {
  return LAT_VOWELS.includes(ch) || CYR_VOWELS.includes(ch)
}

function isAlphaChar(ch: string): boolean {
  return /[A-Za-z]/.test(ch) || CYR_VOWELS.includes(ch) || CYR_CONSONANTS.includes(ch)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function convertApostropheDigraphs(s: string): string {
  return s
    .replace(/o['ʻ‘’`´]/g, 'ў')
    .replace(/O['ʻ‘’`´]/g, 'Ў')
    .replace(/g['ʻ‘’`´]/g, 'ғ')
    .replace(/G['ʻ‘’`´]/g, 'Ғ')
}

function convertConsonantDigraphs(s: string): string {
  let result = s
  for (const [lat, cyr] of CONSONANT_DIGRAPHS) {
    const upper = lat.toUpperCase()
    const capFirst = capitalize(lat)
    const cyrUpper = cyr.toUpperCase()
    const cyrCapFirst = capitalize(cyr)
    result = result.split(upper).join(cyrUpper)
    result = result.split(capFirst).join(cyrCapFirst)
    result = result.split(lat).join(cyr)
  }
  return result
}

// "e" so'z boshida yoki unlidan keyin -> "э"; undoshdan keyin -> "е".
function convertE(s: string): string {
  let result = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i] ?? ''
    if (ch !== 'e' && ch !== 'E') {
      result += ch
      continue
    }
    const prev = i > 0 ? (s[i - 1] ?? '') : ''
    const startOfWord = prev === '' || !isAlphaChar(prev)
    const afterVowel = isVowelChar(prev)
    const useE = startOfWord || afterVowel
    result += useE ? (ch === 'e' ? 'э' : 'Э') : (ch === 'e' ? 'е' : 'Е')
  }
  return result
}

function convertSingleLetters(s: string): string {
  let result = ''
  for (const ch of s) {
    const lower = ch.toLowerCase()
    const mapped = SINGLE_LOWER[lower]
    if (!mapped) {
      result += ch
      continue
    }
    result += ch === lower ? mapped : mapped.toUpperCase()
  }
  return result
}

export function transliterateUzToCyrillic(input: string): string {
  if (!input) return input

  const tokens: string[] = []
  let text = input
  for (const term of PROTECTED_TERMS) {
    if (!term || !text.includes(term)) continue
    text = text.split(term).join(TOKEN_MARK + tokens.length + TOKEN_MARK)
    tokens.push(term)
  }

  text = convertApostropheDigraphs(text)
  text = convertConsonantDigraphs(text)
  text = text.replace(APOSTROPHES, 'ъ')
  text = convertE(text)
  text = convertSingleLetters(text)

  text = text.replace(TOKEN_PATTERN, (match, idx: string) => tokens[Number(idx)] ?? match)
  return text
}

export function deepTransliterate<T>(value: T): T {
  if (typeof value === 'string') {
    return transliterateUzToCyrillic(value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepTransliterate(item)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>)) {
      result[key] = deepTransliterate((value as Record<string, unknown>)[key])
    }
    return result as T
  }
  return value
}
