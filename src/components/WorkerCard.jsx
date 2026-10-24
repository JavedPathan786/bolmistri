import { SERVICES } from '../data/services'

// One worker card in the list
export default function WorkerCard({ worker, onRequest }) {
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
      </div>

      <div className="card-bottom">
        <div className="price">
          <small>शुरुआती दाम / Starts at</small>
          <strong>₹{worker.startingPrice}</strong>
        </div>
        <button className="btn btn-primary" onClick={() => onRequest(worker)}>
          रिक्वेस्ट भेजो / Request
        </button>
      </div>
    </article>
  )
}
