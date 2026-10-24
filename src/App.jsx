import { useEffect, useMemo, useState } from 'react'
import CustomerScreen from './components/CustomerScreen'
import WorkerMap from './components/WorkerMap'
import WorkerCard from './components/WorkerCard'
import { detectService } from './detectService'
import { workers } from './data/workers'
import { distanceKm, arrivalMinutes } from './utils/geo'

const DELHI = { lat: 28.6139, lng: 77.209 }

export default function App() {
  const [result, setResult] = useState(null) // { text, service, urgent }
  const [loading, setLoading] = useState(false)
  const [userPos, setUserPos] = useState({ ...DELHI, demo: true })
  const [toast, setToast] = useState('')

  // Ask the browser for the customer's location
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude }
        // Fake workers are only in Delhi. If user is far away, keep Delhi demo location.
        if (distanceKm(pos.lat, pos.lng, DELHI.lat, DELHI.lng) < 60) {
          setUserPos({ ...pos, demo: false })
        }
      },
      () => {} // if the user says no, we keep the Delhi center
    )
  }, [])

  // Called when the customer speaks or types
  async function handleSearch(text) {
    setLoading(true)
    const found = await detectService(text) // works with sync or async
    setResult({ text, ...found })
    setLoading(false)
  }

  // Workers of that service, with distance and arrival time, nearest first
  const nearby = useMemo(() => {
    if (!result?.service) return []
    return workers
      .filter((w) => w.service === result.service && w.available)
      .map((w) => {
        const km = distanceKm(userPos.lat, userPos.lng, w.lat, w.lng)
        return { ...w, km, minutes: arrivalMinutes(km) }
      })
      .sort((a, b) => a.km - b.km)
  }, [result?.service, userPos])

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>BolMistri <span>बोल मिस्त्री</span></h1>
        <p>बोलो, मिस्त्री पाओ · Speak and get help</p>
      </header>

      <main>
        <CustomerScreen onSearch={handleSearch} result={result} />
        {loading && <p className="hint">🤖 समझ रहा हूँ... / Understanding your problem...</p>}

        <WorkerMap userPos={userPos} workers={nearby} />
        {userPos.demo && (
          <p className="hint">📍 डेमो लोकेशन: दिल्ली / Demo location: Delhi center</p>
        )}

        {result?.service && (
          <section>
            <h2 className="list-title">पास के मिस्त्री / Nearby workers ({nearby.length})</h2>
            {nearby.length === 0 && (
              <div className="panel">कोई मिस्त्री नहीं मिला / No worker found.</div>
            )}
            {nearby.map((w) => (
              <WorkerCard
                key={w.id}
                worker={w}
                onRequest={(worker) => showToast(`Request sent to ${worker.name} (demo)`)}
              />
            ))}
          </section>
        )}
      </main>

      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  )
}
