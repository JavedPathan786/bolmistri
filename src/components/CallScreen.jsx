import { useEffect, useState } from 'react'
import { answerCall, endCall, formatDuration } from '../store'

// Demo call screen. No real audio yet, and no phone numbers are used or shown.
// me = 'customer' or 'worker'
export default function CallScreen({ request, me }) {
  const call = request.call
  const otherName = me === 'customer' ? request.workerName : 'ग्राहक / Customer'
  const incoming = call.status === 'ringing' && call.by !== me
  const [now, setNow] = useState(Date.now())
  const [muted, setMuted] = useState(false)

  // Update the timer every second while the call is active
  useEffect(() => {
    if (call.status !== 'active') return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [call.status])

  return (
    <div className="sheet call">
      <div className="call-avatar">📞</div>
      <h3>{otherName}</h3>
      <p className="hint">🔒 BolMistri कॉल · नंबर छिपे हैं / BolMistri call · numbers hidden</p>

      {call.status === 'ringing' && (
        <p>{incoming ? '📲 कॉल आ रही है / Incoming call...' : '⏳ घंटी बज रही है / Ringing...'}</p>
      )}
      {call.status === 'active' && <p className="timer">{formatDuration(now - call.startedAt)}</p>}

      <div className="row">
        {incoming && (
          <>
            <button className="btn btn-green" onClick={() => answerCall(request.id)}>✔ उठाओ / Answer</button>
            <button className="btn btn-red" onClick={() => endCall(request.id)}>✕ काटो / Decline</button>
          </>
        )}
        {call.status === 'ringing' && !incoming && (
          <button className="btn btn-red" onClick={() => endCall(request.id)}>✕ रद्द करो / Cancel</button>
        )}
        {call.status === 'active' && (
          <>
            <button className="btn btn-light" onClick={() => setMuted(!muted)}>
              {muted ? '🔇 म्यूट चालू / Muted' : '🎤 म्यूट / Mute'}
            </button>
            <button className="btn btn-red" onClick={() => endCall(request.id)}>📵 खत्म / End</button>
          </>
        )}
      </div>

      <p className="hint">डेमो कॉल: अभी असली आवाज़ नहीं / Demo call: no real audio yet</p>
    </div>
  )
}
