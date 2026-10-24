// Star rules for customers.
// Everyone starts with 100 points = 5.0 stars.
export const START_SCORE = 100
export const WARN_BELOW = 50 // below this: "Risky" badge, workers see a warning
export const BLOCK_BELOW = 30 // below this: "Defaulter", cannot send new requests

// Points for each event (plus = reward, minus = penalty)
export const POINTS = {
  done: 3,
  cancelAccepted: -5,
  cancelEnroute: -10,
  noshow: -20,
  fake: -30,
  unpaid: -40,
}

export const REASONS = {
  done: '✅ काम पूरा, पैसे दिए / Job done and paid',
  cancelAccepted: '↩️ बुकिंग के बाद कैंसल / Cancelled after booking',
  cancelEnroute: '↩️ मिस्त्री के निकलने के बाद कैंसल / Cancelled when worker was on the way',
  noshow: '🚫 जगह पर नहीं मिले / Not at the place',
  fake: '❌ झूठी रिक्वेस्ट / Fake request',
  unpaid: '💸 पैसे नहीं दिए / Did not pay',
}

// The list shown on the "Star rules" screen
export const RULES = Object.keys(POINTS).map((key) => ({ key, text: REASONS[key], points: POINTS[key] }))

export const signed = (n) => (n > 0 ? '+' + n : n < 0 ? '-' + Math.abs(n) : '0')

// 100 points -> 5.0 stars
export const stars = (score) => (score / 20).toFixed(1)

export function trustOf(trustMap, customerId) {
  return trustMap[customerId] || { score: START_SCORE, log: [] }
}

export const scoreOf = (trustMap, customerId) => trustOf(trustMap, customerId).score

// Badge for a score
export function trustLevel(score) {
  if (score < BLOCK_BELOW) return { key: 'defaulter', cls: 'badge-red', text: '🚫 डिफॉल्टर / Defaulter' }
  if (score < WARN_BELOW) return { key: 'risky', cls: 'badge-orange', text: '⚠️ जोखिम / Risky' }
  if (score >= 80) return { key: 'trusted', cls: 'badge-green', text: '🌟 भरोसेमंद / Trusted' }
  return { key: 'normal', cls: 'badge-blue', text: '🙂 सामान्य / Normal' }
}
