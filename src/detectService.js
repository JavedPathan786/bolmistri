// FREE service detection. No API, no key, works offline.
// Understands Hindi (देवनागरी), English and Hinglish (Hindi in English letters).
// Always returns: { service, urgent }
// Later (optional): you can call an AI here. Keep the same return shape.

// ---- Word lists ----
// titles = the job name (strong match, worth 3 points)
// words  = problem words (worth 1 point each)
// English/Hinglish words must match the full word.
// A * at the end means "starts with" (leak* matches leaking, leakage).
const SERVICES = {
  plumber: {
    titles: ['प्लंबर', 'प्लम्बर', 'plumber', 'plumbing'],
    words: [
      'नल', 'पाइप', 'पानी', 'टपक', 'लीक', 'नाली', 'टोंटी', 'टंकी', 'सीवर', 'चोक',
      'nal', 'naal', 'paani', 'pani', 'tonti', 'tanki', 'nali', 'naali',
      'tap', 'taps', 'tapak*', 'leak*', 'pipe*', 'drain*', 'choke*', 'sewer*',
    ],
  },
  electrician: {
    titles: ['इलेक्ट्रीशियन', 'इलेक्ट्रिशियन', 'electrician'],
    words: [
      'बिजली', 'पंखा', 'स्विच', 'तार', 'बल्ब', 'लाइट', 'करंट', 'ट्यूबलाइट',
      'bijli', 'bijlee', 'pankha', 'panka', 'fan', 'switch*', 'taar', 'wire*', 'wiring',
      'bulb*', 'light*', 'current', 'mcb', 'tubelight', 'electric*', 'spark*',
    ],
  },
  painter: {
    titles: ['पेंटर', 'पेन्टर', 'painter'],
    words: [
      'पेंट', 'पेन्ट', 'रंग', 'पुताई', 'रंगाई',
      'paint*', 'putai', 'rang', 'rangai', 'colour', 'color',
    ],
  },
  cleaner: {
    titles: ['क्लीनर', 'cleaner'],
    words: ['सफाई', 'साफ', 'धुलाई', 'safai', 'saaf', 'saf', 'clean*', 'dust*'],
  },
  maid: {
    titles: ['मेड', 'कामवाली', 'maid', 'kaamwali', 'kamwali'],
    words: ['बाई', 'झाड़ू', 'पोछा', 'पोंछा', 'बर्तन', 'bai', 'jhadu', 'jhaadu', 'pocha', 'poncha', 'bartan'],
  },
  cook: {
    titles: ['कुक', 'रसोइया', 'रसोईया', 'cook*', 'chef'],
    words: ['खाना', 'रसोई', 'नाश्ता', 'टिफिन', 'khana', 'khaana', 'rasoi', 'nashta', 'tiffin', 'roti'],
  },
}

const URGENT = [
  'जल्दी', 'अभी', 'तुरंत', 'फौरन', 'इमरजेंसी',
  'jaldi', 'abhi', 'turant', 'fauran', 'urgent*', 'emergency', 'asap', 'now', 'immediately',
]

// ---- Helpers ----

// Make text simple: lowercase, remove the Hindi dot (़), chandrabindu (ँ) and hidden marks
const clean = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036F\u093C\u0901\u200B-\u200D]/g, '')

// How different are two English words? (used for spelling mistakes)
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return dp[a.length][b.length]
}

// Does this word appear in the text?
function matches(text, tokens, word) {
  const w = clean(word)
  if (!/^[a-z*]+$/.test(w)) return text.includes(w) // Hindi: simple "includes"
  const prefix = w.endsWith('*')
  const base = prefix ? w.slice(0, -1) : w
  return tokens.some((t) => (prefix ? t.startsWith(base) : t === base))
}

// Same as matches(), plus small spelling mistakes for long job names (plumbar -> plumber)
function matchesTitle(text, tokens, title) {
  if (matches(text, tokens, title)) return true
  const w = clean(title)
  if (!/^[a-z]{6,}$/.test(w)) return false
  const maxMistakes = w.length >= 9 ? 2 : 1
  return tokens.some((t) => t.length >= 5 && levenshtein(t, w) <= maxMistakes)
}

// ---- Main function ----
export function detectService(rawText) {
  const text = clean(rawText || '')
  const tokens = text.split(/[^a-z]+/).filter(Boolean) // English words only

  let best = null
  let bestScore = 0

  for (const [service, { titles, words }] of Object.entries(SERVICES)) {
    const titleScore = titles.some((t) => matchesTitle(text, tokens, t)) ? 3 : 0
    const wordScore = words.filter((w) => matches(text, tokens, w)).length
    const score = titleScore + wordScore
    if (score > bestScore) {
      best = service
      bestScore = score
    }
  }

  const urgent = URGENT.some((w) => matches(text, tokens, w))
  return { service: best, urgent }
}
