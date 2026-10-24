import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SERVICES } from '../data/services'

// A round pin made from an emoji (no image files needed)
function makePin(emoji, extraClass) {
  return L.divIcon({
    html: emoji,
    className: 'pin ' + extraClass,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Map with the customer pin and worker markers
export default function WorkerMap({ userPos, workers }) {
  const boxRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  // 1) Create the map one time
  useEffect(() => {
    const map = L.map(boxRef.current).setView([userPos.lat, userPos.lng], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => map.remove()
  }, [])

  // 2) Draw markers again when the location or workers change
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    layer.clearLayers()

    const points = [[userPos.lat, userPos.lng]]
    L.marker([userPos.lat, userPos.lng], { icon: makePin('📍', 'pin-user') })
      .addTo(layer)
      .bindPopup('आप यहाँ हैं / You are here')

    workers.forEach((w) => {
      // textContent keeps the popup safe when names come from a database later
      const box = document.createElement('div')
      box.textContent = `${w.name} · ⭐ ${w.rating} · ₹${w.startingPrice} · ${w.km.toFixed(1)} km`
      L.marker([w.lat, w.lng], { icon: makePin(SERVICES[w.service].emoji, '') })
        .addTo(layer)
        .bindPopup(box)
      points.push([w.lat, w.lng])
    })

    if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 15 })
    else map.setView(points[0], 13)
  }, [userPos, workers])

  return <div className="map" ref={boxRef} />
}
