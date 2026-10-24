// Shared demo store: requests, price offers, chat, calls, live trip and star points.
// Data is saved in localStorage, so two browser windows on the SAME device stay in sync.
// Later: put Supabase (free, live) inside these functions.
// Keep the same function names, so the screens do not need to change.

import { START_SCORE, BLOCK_BELOW, POINTS, REASONS, signed, scoreOf } from './utils/trust.js'
import { hasArrived } from './utils/trip.js'

const KEY = 'bolmistri_state_v2'
const ID_KEY = 'bolmistri_customer_id'
export const OPEN_STATUSES = ['pending', 'offered', 'accepted', 'enroute'] // still alive
const FINISH = ['done', 'unpaid', 'noshow', 'fake'] // results the worker can report
const listeners = new Set()
const EMPTY = { requests: [], trust: {} }

let cache = EMPTY

// Read saved data
function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const data = JSON.parse(raw)
    return Array.isArray(data.requests) ? { requests: data.requests, trust: data.trust || {} } : EMPTY
  } catch {
    return cache // storage not available: keep what we have in memory
  }
}

// Save data and tell the screens
function save(state) {
  cache = state
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage not available: data stays in memory only
  }
  listeners.forEach((l) => l())
}

cache = load()

// Another window changed the data
window.addEventListener('storage', (e) => {
  if (e.key === KEY || e.key === null) {
    cache = load()
    listeners.forEach((l) => l())
  }
})

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// { requests: [...], trust: { customerId: { score, log } } }
export function getState() {
  return cache
}

const uid = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const note = (text) => ({ id: uid('m'), from: 'system', text, at: Date.now() })
const isLive = (call) => call && (call.status === 'ringing' || call.status === 'active')
const endLive = (call) => (isLive(call) ? { ...call, status: 'ended' } : call)
const isOpen = (r) => OPEN_STATUSES.includes(r.status)

// Change the whole state. Always starts from the newest saved data.
function update(change) {
  save(change(load()))
}

// Change one request
function patch(id, change) {
  update((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? change(r) : r)) }))
}

// Add or remove star points for a customer (0 to 100)
function withTrust(state, customerId, delta, reason, requestId) {
  const cur = state.trust[customerId] || { score: START_SCORE, log: [] }
  const score = Math.max(0, Math.min(START_SCORE, cur.score + delta))
  const entry = { at: Date.now(), delta, reason, requestId }
  return { ...state, trust: { ...state.trust, [customerId]: { score, log: [entry, ...cur.log].slice(0, 20) } } }
}

// Each browser gets one customer id (no login yet)
export function getCustomerId() {
  try {
    let id = localStorage.getItem(ID_KEY)
    if (!id) {
      id = uid('c')
      localStorage.setItem(ID_KEY, id)
    }
    return id
  } catch {
    return 'c-local'
  }
}

// Hide phone numbers typed in chat (8 or more digits)
export function maskNumbers(text) {
  return text.replace(/\+?\d[\d\s\-().]{6,}\d/g, (m) =>
    m.replace(/\D/g, '').length >= 8 ? '[number hidden]' : m
  )
}

// 00:00 style time
export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
}

// ---------- Customer actions ----------

// Customer taps "Request". One open request per worker.
// Returns null if the customer is blocked (Defaulter).
export function createRequest({ text, service, urgent, worker, km, minutes, customerId, customerPos }) {
  const state = load()
  if (scoreOf(state.trust, customerId) < BLOCK_BELOW) return null
  const existing = state.requests.find((r) => r.workerId === worker.id && r.customerId === customerId && isOpen(r))
  if (existing) return existing.id
  const request = {
    id: uid('r'),
    createdAt: Date.now(),
    customerId,
    customerPos, // { lat, lng }
    text,
    service,
    urgent,
    workerId: worker.id,
    workerName: worker.name,
    workerPos: { lat: worker.lat, lng: worker.lng },
    startingPrice: worker.startingPrice,
    km,
    minutes,
    // pending -> offered -> accepted -> enroute -> done / unpaid / noshow / fake
    // (or declined / cancelled)
    status: 'pending',
    offerPrice: null,
    trip: null,
    result: null, // { outcome, delta }
    workerRating: null,
    messages: [],
    call: null,
  }
  save({ ...state, requests: [request, ...state.requests] })
  return request.id
}

export function acceptOffer(id) {
  patch(id, (r) =>
    r.status === 'offered'
      ? { ...r, status: 'accepted', messages: [...r.messages, note(`✅ ग्राहक ने मान लिया / Customer accepted ₹${r.offerPrice}`)] }
      : r
  )
}

// Customer cancels. Free before booking. After booking the customer loses points.
export function cancelRequest(id) {
  update((s) => {
    const r = s.requests.find((x) => x.id === id)
    if (!r || !isOpen(r)) return s
    const key = r.status === 'accepted' ? 'cancelAccepted' : r.status === 'enroute' ? 'cancelEnroute' : null
    const delta = key ? POINTS[key] : 0
    const text = key ? `${REASONS[key]} (${signed(delta)})` : '↩️ ग्राहक ने कैंसल किया / Customer cancelled'
    const next = {
      ...s,
      requests: s.requests.map((x) =>
        x.id === id
          ? { ...x, status: 'cancelled', result: key ? { outcome: key, delta } : null, call: endLive(x.call), messages: [...x.messages, note(text)] }
          : x
      ),
    }
    return key ? withTrust(next, r.customerId, delta, key, id) : next
  })
}

// Customer rates the worker after the job (1 to 5)
export function rateWorker(id, stars) {
  const n = Math.max(1, Math.min(5, Math.round(stars)))
  patch(id, (r) => (r.status === 'done' && !r.workerRating ? { ...r, workerRating: n } : r))
}

// ---------- Worker actions ----------

export function sendOffer(id, price) {
  patch(id, (r) =>
    r.status === 'pending' || r.status === 'offered'
      ? { ...r, status: 'offered', offerPrice: price, messages: [...r.messages, note(`💰 ऑफर / Offer: ₹${price}`)] }
      : r
  )
}

export function declineRequest(id) {
  patch(id, (r) =>
    r.status === 'pending' || r.status === 'offered'
      ? { ...r, status: 'declined', call: endLive(r.call), messages: [...r.messages, note('❌ मिस्त्री ने मना किया / Worker declined')] }
      : r
  )
}

// Worker starts the trip. The worker pin starts moving to the customer.
export function startTrip(id) {
  patch(id, (r) =>
    r.status === 'accepted'
      ? {
          ...r,
          status: 'enroute',
          trip: { startedAt: Date.now(), from: r.workerPos, to: r.customerPos, etaMin: r.minutes },
          messages: [...r.messages, note('🚗 मिस्त्री निकल पड़ा / Worker started the trip')],
        }
      : r
  )
}

// Worker reports the result after arriving: 'done', 'unpaid', 'noshow' or 'fake'.
// The customer gets or loses star points.
export function finishJob(id, outcome) {
  if (!FINISH.includes(outcome)) return
  update((s) => {
    const r = s.requests.find((x) => x.id === id)
    if (!r || r.status !== 'enroute' || !hasArrived(r.trip, Date.now())) return s
    const delta = POINTS[outcome]
    const next = {
      ...s,
      requests: s.requests.map((x) =>
        x.id === id
          ? { ...x, status: outcome, result: { outcome, delta }, call: endLive(x.call), messages: [...x.messages, note(`${REASONS[outcome]} (${signed(delta)})`)] }
          : x
      ),
    }
    return withTrust(next, r.customerId, delta, outcome, id)
  })
}

// ---------- Chat ----------

// from = 'customer' or 'worker'
export function sendMessage(id, from, text) {
  const clean = maskNumbers(String(text).trim()).slice(0, 500)
  if (!clean) return
  patch(id, (r) =>
    isOpen(r) ? { ...r, messages: [...r.messages, { id: uid('m'), from, text: clean, at: Date.now() }] } : r
  )
}

// ---------- Demo call (no real audio yet, and no phone numbers are used) ----------

export function startCall(id, by) {
  patch(id, (r) => (!isOpen(r) || isLive(r.call) ? r : { ...r, call: { status: 'ringing', by, startedAt: null } }))
}

export function answerCall(id) {
  patch(id, (r) =>
    r.call && r.call.status === 'ringing' ? { ...r, call: { ...r.call, status: 'active', startedAt: Date.now() } } : r
  )
}

export function endCall(id) {
  patch(id, (r) => {
    if (!isLive(r.call)) return r
    const text =
      r.call.status === 'active'
        ? `📞 कॉल खत्म / Call ended · ${formatDuration(Date.now() - r.call.startedAt)}`
        : '📞 कॉल नहीं उठी / Call not answered'
    return { ...r, call: { ...r.call, status: 'ended' }, messages: [...r.messages, note(text)] }
  })
}

// Clear all demo data (requests and star points)
export function resetDemo() {
  save(EMPTY)
}
