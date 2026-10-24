import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SERVICES } from '../data/services'
import { DEMO_SPEEDUP, tripProgress, tripPosition, minutesLeft } from '../utils/trip'

// A round pin made from an emoji
function makePin(emoji, extraClass) {
  return L.divIcon({ html: emoji, className: 'pin ' + extraClass, iconSize: [36, 36], iconAnchor: [18, 18] })
}

// Live tracking: the worker pin moves to the customer and the time left counts down.
// arrivedContent is shown only after the worker has arrived.
export default function TrackCard({ request, arrivedContent }) {
  const { trip } = request
  const boxRef = useRef(null)
  const workerPin = useRef(null)
  const [now, setNow] = useState(Date.now())

  const p = tripProgress(trip, now) // 0 to 1
  const arrived = p >= 1
  const pos = tripPosition(trip, p)
  const left = minutesLeft(trip, p)

  // Update the clock twice a second until the worker arrives
  useEffect(() => {
    if (arrived) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [arrived])

  // Create the map one time
  useEffect(() => {
    const map = L.map(boxRef.current, { zoomControl: false })
    map.fitBounds(
      [[trip.from.lat, trip.from.lng], [trip.to.lat, trip.to.lng]],
      { padding: [40, 40], maxZoom: 16 }
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    L.polyline([[trip.from.lat, trip.from.lng], [trip.to.lat, trip.to.lng]], { color: '#f97316', dashArray: '6 8' }).addTo(map)
    L.marker([trip.to.lat, trip.to.lng], { icon: makePin('📍', 'pin-user') }).addTo(map)
    workerPin.current = L.marker([trip.from.lat, trip.from.lng], {
      icon: makePin(SERVICES[request.service]?.emoji || '🛠', ''),
    }).addTo(map)
    return () => map.remove()
  }, [])

  // Move the worker pin
  useEffect(() => {
    workerPin.current?.setLatLng([pos.lat, pos.lng])
  }, [pos.lat, pos.lng])

  return (
    <div className="track">
      <div className="map map-small" ref={boxRef} />
      <div className="trackbar">
        <div className="trackfill" style={{ width: Math.round(p * 100) + '%' }} />
      </div>
      <p className="track-info">
        {arrived
          ? '🎉 मिस्त्री पहुँच गया / Worker has arrived'
          : `🚗 पहुँचने में लगभग ${left} मिनट / Arrives in about ${left} min`}
      </p>
      <p className="hint">
        📍 बचा / Left: {(request.km * (1 - p)).toFixed(1)} km · डेमो स्पीड ×{DEMO_SPEEDUP} / Demo speed ×{DEMO_SPEEDUP}
      </p>
      {arrived && arrivedContent}
    </div>
  )
}
