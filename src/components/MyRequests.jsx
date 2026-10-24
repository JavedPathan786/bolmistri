import { SERVICES } from '../data/services'
import TrackCard from './TrackCard'
import { acceptOffer, cancelRequest, rateWorker, startCall, OPEN_STATUSES } from '../store'
import { POINTS, REASONS, signed } from '../utils/trust'

const STATUS = {
  pending: { cls: 'badge-orange', text: '⏳ दाम का इंतज़ार / Waiting for price' },
  offered: { cls: 'badge-blue', text: '💰 ऑफर आया / Offer received' },
  accepted: { cls: 'badge-green', text: '✅ बुक हो गया / Booked' },
  enroute: { cls: 'badge-blue', text: '🚗 मिस्त्री रास्ते में / Worker on the way' },
  done: { cls: 'badge-green', text: '✅ काम पूरा / Job done' },
  unpaid: { cls: 'badge-red', text: '💸 पैसे नहीं दिए / Not paid' },
  noshow: { cls: 'badge-red', text: '🚫 जगह पर नहीं मिले / Not at the place' },
  fake: { cls: 'badge-red', text: '❌ झूठी रिक्वेस्ट / Fake request' },
  cancelled: { cls: 'badge-gray', text: '↩️ कैंसल / Cancelled' },
  declined: { cls: 'badge-red', text: '❌ मना किया / Declined' },
}

// Customer side: my requests, offers, live tracking, chat, call and rating
export default function MyRequests({ requests, onChat }) {
  if (requests.length === 0) return null

  // Cancelling after booking costs points, so we ask first
  function handleCancel(r) {
    const penalty = r.status === 'accepted' ? POINTS.cancelAccepted : r.status === 'enroute' ? POINTS.cancelEnroute : 0
    const ask = penalty
      ? `इससे आपके ${Math.abs(penalty)} पॉइंट घटेंगे। पक्का? / This will reduce your points by ${Math.abs(penalty)}. Are you sure?`
      : 'रिक्वेस्ट कैंसल करें? / Cancel this request?'
    if (window.confirm(ask)) cancelRequest(r.id)
  }

  return (
    <section>
      <h2 className="list-title">मेरी रिक्वेस्ट / My requests ({requests.length})</h2>
      {requests.map((r) => {
        const st = STATUS[r.status]
        const open = OPEN_STATUSES.includes(r.status)
        const callBusy = r.call && (r.call.status === 'ringing' || r.call.status === 'active')
        return (
          <article className="card" key={r.id}>
            <div className="card-top">
              <div className="avatar">{SERVICES[r.service]?.emoji}</div>
              <div>
                <h3>{r.workerName}</h3>
                <p>📍 {r.km.toFixed(1)} km · ⏱ ~{r.minutes} min</p>
              </div>
            </div>
            <div className="badges">
              <span className={'badge ' + st.cls}>{st.text}</span>
            </div>

            {r.status === 'pending' && (
              <p className="hint">शुरुआती दाम / Starts at ₹{r.startingPrice}. मिस्त्री अपना दाम भेजेगा / The worker will send a price.</p>
            )}

            {r.status === 'offered' && (
              <div className="offer">
                <div>
                  <small>मिस्त्री का दाम / Worker's price</small>
                  <br />
                  <strong>₹{r.offerPrice}</strong>
                </div>
                <button className="btn btn-green" onClick={() => acceptOffer(r.id)}>
                  ✔ मंज़ूर है / Accept
                </button>
              </div>
            )}

            {r.status === 'accepted' && (
              <div className="offer offer-ok">
                ✅ ₹{r.offerPrice} में बुक · मिस्त्री जल्द निकलेगा / Booked for ₹{r.offerPrice} · the worker will start soon
              </div>
            )}

            {r.status === 'enroute' && (
              <TrackCard
                request={r}
                arrivedContent={
                  <div className="offer">
                    💰 काम के बाद ₹{r.offerPrice} दें (कैश/UPI)। पैसे न देने पर {Math.abs(POINTS.unpaid)} पॉइंट कटेंगे। /
                    Pay ₹{r.offerPrice} after the work (cash/UPI). Not paying costs {Math.abs(POINTS.unpaid)} points.
                  </div>
                }
              />
            )}

            {r.result && (
              <div className={'offer ' + (r.result.delta < 0 ? 'offer-bad' : 'offer-ok')}>
                {REASONS[r.result.outcome]} · {signed(r.result.delta)} पॉइंट / points
              </div>
            )}

            {r.status === 'done' && (
              <div className="rate">
                {r.workerRating ? (
                  <p>धन्यवाद! आपकी रेटिंग / Thanks! Your rating: {'⭐'.repeat(r.workerRating)}</p>
                ) : (
                  <>
                    <small>मिस्त्री को रेटिंग दें / Rate the worker</small>
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} className="star-btn" onClick={() => rateWorker(r.id, n)}>
                          {n}⭐
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {(open || r.messages.length > 0) && (
              <div className="actions">
                <button className="btn btn-light" onClick={() => onChat(r.id)}>💬 चैट / Chat</button>
                {open && (
                  <button className="btn btn-light" disabled={callBusy} onClick={() => startCall(r.id, 'customer')}>
                    📞 कॉल / Call
                  </button>
                )}
                {open && (
                  <button className="btn btn-light" onClick={() => handleCancel(r)}>↩️ कैंसल / Cancel</button>
                )}
              </div>
            )}
          </article>
        )
      })}
    </section>
  )
}
