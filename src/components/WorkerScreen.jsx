import { useState } from 'react'
import { SERVICES } from '../data/services'
import TrackCard from './TrackCard'
import { sendOffer, declineRequest, startCall, startTrip, finishJob, OPEN_STATUSES } from '../store'
import { REASONS, signed, stars, trustLevel, trustOf } from '../utils/trust'

const STATUS = {
  pending: { cls: 'badge-orange', text: '🆕 नई रिक्वेस्ट / New request' },
  offered: { cls: 'badge-blue', text: '⏳ ग्राहक के जवाब का इंतज़ार / Waiting for customer' },
  accepted: { cls: 'badge-green', text: '✅ बुक हो गया / Booked' },
  enroute: { cls: 'badge-blue', text: '🚗 रास्ते में / On the way' },
  done: { cls: 'badge-green', text: '✅ काम पूरा / Job done' },
  unpaid: { cls: 'badge-red', text: '💸 पैसे नहीं मिले / Not paid' },
  noshow: { cls: 'badge-red', text: '🚫 ग्राहक नहीं मिला / Customer not there' },
  fake: { cls: 'badge-red', text: '❌ झूठी रिक्वेस्ट / Fake request' },
  cancelled: { cls: 'badge-gray', text: '↩️ ग्राहक ने कैंसल किया / Customer cancelled' },
  declined: { cls: 'badge-red', text: '❌ मना किया / Declined' },
}

// Worker side: requests, own price, trip, result report, chat and call
export default function WorkerScreen({ workers, workerId, onSelect, requests, trust, onChat, onToast }) {
  const [prices, setPrices] = useState({}) // price typed for each request

  function handleSend(r) {
    const price = Math.round(Number(prices[r.id] ?? r.offerPrice ?? r.startingPrice))
    if (!price || price < 1 || price > 100000) {
      onToast('सही दाम डालें / Enter a valid price')
      return
    }
    sendOffer(r.id, price)
    onToast(`ऑफर भेजा / Offer sent: ₹${price}`)
  }

  // A report costs the customer points, so we ask first
  function report(r, outcome) {
    if (window.confirm('सच बताएं। ग्राहक के पॉइंट घटेंगे। पक्का? / Report honestly. The customer will lose points. Are you sure?')) {
      finishJob(r.id, outcome)
    }
  }

  return (
    <>
      <section className="panel">
        <label className="label" htmlFor="who">मैं हूँ / I am:</label>
        <select id="who" className="input select" value={workerId} onChange={(e) => onSelect(Number(e.target.value))}>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {SERVICES[w.service].emoji} {w.name} ({SERVICES[w.service].en})
            </option>
          ))}
        </select>
        <p className="hint">डेमो: असली लॉगिन बाद में / Demo: real login comes later</p>
      </section>

      <section>
        <h2 className="list-title">ग्राहक की रिक्वेस्ट / Customer requests ({requests.length})</h2>

        {requests.length === 0 && (
          <div className="panel">
            अभी कोई रिक्वेस्ट नहीं / No requests yet. ग्राहक वाली विंडो में इस मिस्त्री पर Request दबाएँ / In the Customer window, tap Request on this worker.
          </div>
        )}

        {requests.map((r) => {
          const st = STATUS[r.status]
          const open = OPEN_STATUSES.includes(r.status)
          const callBusy = r.call && (r.call.status === 'ringing' || r.call.status === 'active')
          const canPrice = r.status === 'pending' || r.status === 'offered'
          const customer = trustOf(trust, r.customerId)
          const level = trustLevel(customer.score)
          return (
            <article className="card" key={r.id}>
              <div className="card-top">
                <div className="avatar">{SERVICES[r.service]?.emoji}</div>
                <div>
                  <h3>ग्राहक / Customer</h3>
                  <p>📍 {r.km.toFixed(1)} km · ⏱ ~{r.minutes} min</p>
                </div>
              </div>

              <div className="said">
                <small>ग्राहक ने कहा / Customer said:</small>
                <q>{r.text}</q>
              </div>

              <div className="badges" style={{ marginTop: 10 }}>
                {r.urgent && <span className="badge badge-red">🚨 जरूरी / Urgent</span>}
                <span className={'badge ' + st.cls}>{st.text}</span>
                <span className={'badge ' + level.cls}>⭐ {stars(customer.score)} · {level.text}</span>
              </div>

              {level.key === 'risky' && canPrice && (
                <div className="offer offer-bad">
                  ⚠️ जोखिम वाला ग्राहक: एडवांस माँगें या मना करें / Risky customer: ask for an advance or decline.
                </div>
              )}

              {canPrice && (
                <>
                  <label className="label" htmlFor={'p' + r.id}>आपका दाम (₹) / Your price (₹)</label>
                  <div className="price-row">
                    <input
                      id={'p' + r.id}
                      className="input"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={prices[r.id] ?? r.offerPrice ?? r.startingPrice}
                      onChange={(e) => setPrices({ ...prices, [r.id]: e.target.value })}
                    />
                    <button className="btn btn-primary" onClick={() => handleSend(r)}>
                      {r.status === 'offered' ? 'दाम बदलो / Update' : '💰 ऑफर भेजो / Send offer'}
                    </button>
                  </div>
                </>
              )}

              {r.status === 'accepted' && (
                <>
                  <div className="offer offer-ok">✅ ग्राहक ने ₹{r.offerPrice} मान लिया / Customer accepted ₹{r.offerPrice}</div>
                  <div className="actions">
                    <button className="btn btn-green" onClick={() => startTrip(r.id)}>🚗 निकल पड़ा / Start trip</button>
                  </div>
                </>
              )}

              {r.status === 'enroute' && (
                <TrackCard
                  request={r}
                  arrivedContent={
                    <>
                      <p className="label">काम का नतीजा बताएं (सच बताएं) / Report the result (be honest)</p>
                      <div className="actions">
                        <button className="btn btn-green" onClick={() => finishJob(r.id, 'done')}>✅ काम पूरा, पैसे मिले / Done and paid</button>
                        <button className="btn btn-red" onClick={() => report(r, 'unpaid')}>💸 पैसे नहीं मिले / Not paid</button>
                        <button className="btn btn-light" onClick={() => report(r, 'noshow')}>🚫 ग्राहक नहीं मिला / Customer not there</button>
                        <button className="btn btn-light" onClick={() => report(r, 'fake')}>❌ झूठी रिक्वेस्ट / Fake request</button>
                      </div>
                    </>
                  }
                />
              )}

              {r.result && (
                <div className={'offer ' + (r.result.delta < 0 ? 'offer-bad' : 'offer-ok')}>
                  {REASONS[r.result.outcome]} · ग्राहक पॉइंट / customer points {signed(r.result.delta)}
                </div>
              )}
              {r.workerRating && <p className="hint">ग्राहक की रेटिंग / Customer's rating: {'⭐'.repeat(r.workerRating)}</p>}

              {(open || r.messages.length > 0) && (
                <div className="actions">
                  <button className="btn btn-light" onClick={() => onChat(r.id)}>💬 चैट / Chat</button>
                  {open && (
                    <button className="btn btn-light" disabled={callBusy} onClick={() => startCall(r.id, 'worker')}>
                      📞 कॉल / Call
                    </button>
                  )}
                  {canPrice && (
                    <button className="btn btn-light" onClick={() => declineRequest(r.id)}>✕ मना करो / Decline</button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </section>
    </>
  )
}
