// Live trip: the worker pin moves in a straight line to the customer.
// DEMO_SPEEDUP makes the trip faster, so judges can see it in seconds.
// (A 15 minute trip takes 45 seconds with speed x20.)
export const DEMO_SPEEDUP = 20

const tripMs = (trip) => (trip.etaMin * 60000) / DEMO_SPEEDUP

// 0 = just started, 1 = arrived
export function tripProgress(trip, now) {
  return Math.min(1, Math.max(0, (now - trip.startedAt) / tripMs(trip)))
}

export const hasArrived = (trip, now) => !!trip && tripProgress(trip, now) >= 1

// Where is the worker now?
export function tripPosition(trip, p) {
  return {
    lat: trip.from.lat + (trip.to.lat - trip.from.lat) * p,
    lng: trip.from.lng + (trip.to.lng - trip.from.lng) * p,
  }
}

// Minutes left (real-life minutes, not demo seconds)
export const minutesLeft = (trip, p) => Math.ceil(trip.etaMin * (1 - p))
