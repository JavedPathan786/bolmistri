import { SERVICES } from '../data/services'

// Shows the state of the request for this worker
function statusText(request) {
  if (request.status === 'pending') return '⏳ दाम का इंतज़ार / Waiting for price'
  if (request.status === 'offered') return `💰 ऑफर / Offer ₹${request.offerPrice}`
  if (request.status === 'enroute') return '🚗 रास्ते में / On the way'
  return '✅ बुक हो गया / Booked'
}

// One worker card in the list
export default function WorkerCard({ worker, request, onRequest, onChat }) {
  const within30 = worker.minutes <= 30

  return (
    <article className="card">
      <div className="card-top">
        <div className="avatar">{SERVICES[worker.service].emoji}</div>
        <div>
          <h3>{worker.name}</h3>
          <p>
            ⭐ {worker.rating.toFixed(1)} · 📍 {worker.km.toFixed(1)} km · ⏱ ~{worker.minutes} min
          </p>
        </div>
      </div>

      <div className="badges">
        {worker.verified && <span className="badge badge-green">✔ वेरिफाइड / Verified</span>}
        {within30 && <span className="badge badge-blue">⚡ 30 मिनट में / Arrives within 30 min</span>}
        {request && <span className="badge badge-orange">{statusText(request)}</span>}
      </div>

      <div className="card-bottom">
        <div className="price">
          <small>शुरुआती दाम / Starts at</small>
          <strong>₹{worker.startingPrice}</strong>
        </div>
        {request ? (
          <button className="btn btn-light" onClick={() => onChat(request.id)}>
            💬 चैट खोलो / Open chat
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => onRequest(worker)}>
            रिक्वेस्ट भेजो / Request
          </button>
        )}
      </div>
    </article>
  )
}
