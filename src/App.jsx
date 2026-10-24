import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import CustomerScreen from './components/CustomerScreen'
import WorkerMap from './components/WorkerMap'
import WorkerCard from './components/WorkerCard'
import MyRequests from './components/MyRequests'
import WorkerScreen from './components/WorkerScreen'
import TrustCard from './components/TrustCard'
import ChatBox from './components/ChatBox'
import CallScreen from './components/CallScreen'
import { detectService } from './detectService'
import { workers } from './data/workers'
import { distanceKm, arrivalMinutes } from './utils/geo'
import { BLOCK_BELOW, trustOf } from './utils/trust'
import { subscribe, getState, getCustomerId, createRequest, resetDemo, OPEN_STATUSES } from './store'

const DELHI = { lat: 28.6139, lng: 77.209 }

// The link ending with #worker opens the Worker screen
const modeFromHash = () => (window.location.hash === '#worker' ? 'worker' : 'customer')

export default function App() {
  const [mode, setMode] = useState(modeFromHash()) // 'customer' or 'worker'
  const [customerId] = useState(getCustomerId) // this browser's customer id
  const [workerId, setWorkerId] = useState(1) // who the worker screen is for
  const [chatId, setChatId] = useState(null) // which request chat is open
  const [result, setResult] = useState(null) // { text, service, urgent }
  const [loading, setLoading] = useState(false)
  const [userPos, setUserPos] = useState({ ...DELHI, demo: true })
  const [toast, setToast] = useState('')

  const state = useSyncExternalStore(subscribe, getState)
  const requests = state.requests
  const trust = trustOf(state.trust, customerId) // { score, log }
  const blocked = trust.score < BLOCK_BELOW // Defaulter: cannot send requests

  // Switch screen when the link changes (#worker)
  useEffect(() => {
    const onHash = () => {
      setMode(modeFromHash())
      setChatId(null)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

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
    const found = await detectService(text)
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

  // Customer taps "Request" on a worker
  function handleRequest(worker) {
    const id = createRequest({
      text: result.text,
      service: result.service,
      urgent: result.urgent,
      worker,
      km: worker.km,
      minutes: worker.minutes,
      customerId,
      customerPos: { lat: userPos.lat, lng: userPos.lng },
    })
    showToast(id ? `रिक्वेस्ट भेजी / Request sent to ${worker.name}` : 'अकाउंट ब्लॉक है / Your account is blocked')
  }

  // Requests this screen should show
  const mine = mode === 'worker' ? requests.filter((r) => r.workerId === workerId) : requests.filter((r) => r.customerId === customerId)
  const activeCall = mine.find((r) => r.call && (r.call.status === 'ringing' || r.call.status === 'active'))
  const chatRequest = chatId ? mine.find((r) => r.id === chatId) : null
  const showList = !blocked && result?.service

  function switchMode(next) {
    window.location.hash = next
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>BolMistri <span>बोल मिस्त्री</span></h1>
        <p>बोलो, मिस्त्री पाओ · Speak and get help</p>
      </header>

      <nav className="tabs">
        <button className={'tab' + (mode === 'customer' ? ' active' : '')} onClick={() => switchMode('customer')}>
          👤 ग्राहक / Customer
        </button>
        <button className={'tab' + (mode === 'worker' ? ' active' : '')} onClick={() => switchMode('worker')}>
          🛠 मिस्त्री / Worker
        </button>
      </nav>

      <main>
        {mode === 'customer' ? (
          <>
            <TrustCard trust={trust} />
            <CustomerScreen onSearch={handleSearch} result={result} />
            {loading && <p className="hint">🤖 समझ रहा हूँ... / Understanding your problem...</p>}

            <MyRequests requests={mine} onChat={setChatId} />

            <WorkerMap userPos={userPos} workers={blocked ? [] : nearby} />
            {userPos.demo && (
              <p className="hint">📍 डेमो लोकेशन: दिल्ली / Demo location: Delhi center</p>
            )}

            {blocked && result?.service && (
              <div className="panel offer-bad">
                🚫 आपके स्टार कम हैं, इसलिए मिस्त्री नहीं दिख रहे। / Your stars are too low, so workers are hidden.
              </div>
            )}

            {showList && (
              <section>
                <h2 className="list-title">पास के मिस्त्री / Nearby workers ({nearby.length})</h2>
                {nearby.length === 0 && (
                  <div className="panel">कोई मिस्त्री नहीं मिला / No worker found.</div>
                )}
                {nearby.map((w) => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    request={mine.find((r) => r.workerId === w.id && OPEN_STATUSES.includes(r.status))}
                    onRequest={handleRequest}
                    onChat={setChatId}
                  />
                ))}
              </section>
            )}
          </>
        ) : (
          <WorkerScreen
            workers={workers}
            workerId={workerId}
            onSelect={(id) => {
              setWorkerId(id)
              setChatId(null)
            }}
            requests={mine}
            trust={state.trust}
            onChat={setChatId}
            onToast={showToast}
          />
        )}
      </main>

      <footer className="foot">
        <p>
          💡 टिप: दो विंडो खोलें। दूसरी विंडो के लिंक के अंत में <b>#worker</b> लगाएँ। / Tip: open two windows.
          In the second one, add <b>#worker</b> at the end of the link.
        </p>
        <button
          className="link-btn"
          onClick={() => {
            resetDemo()
            setChatId(null)
          }}
        >
          🧹 डेमो रीसेट (स्टार भी) / Reset demo (stars too)
        </button>
      </footer>

      {chatRequest && <ChatBox request={chatRequest} me={mode} onClose={() => setChatId(null)} />}
      {activeCall && <CallScreen request={activeCall} me={mode} />}
      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  )
}
