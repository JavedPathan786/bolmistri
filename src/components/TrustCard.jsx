import { RULES, BLOCK_BELOW, WARN_BELOW, REASONS, signed, stars, trustLevel } from '../utils/trust'

// Customer stars, badge, rules and history
export default function TrustCard({ trust }) {
  const level = trustLevel(trust.score)

  return (
    <section className="panel">
      <div className="trust-top">
        <div>
          <small>आपके स्टार / Your stars</small>
          <div className="trust-stars">⭐ {stars(trust.score)} <span>/ 5</span></div>
        </div>
        <span className={'badge ' + level.cls}>{level.text}</span>
      </div>

      {level.key === 'defaulter' && (
        <p className="error">
          🚫 आपका अकाउंट सीमित है। आप नई रिक्वेस्ट नहीं भेज सकते। / Your account is limited. You cannot send new requests.
        </p>
      )}
      {level.key === 'risky' && (
        <p className="hint">
          ⚠️ मिस्त्री आपको मना कर सकते हैं। सही व्यवहार से स्टार बढ़ते हैं। / Workers may decline you. Good behaviour gives stars back.
        </p>
      )}

      <details>
        <summary>स्टार के नियम / Star rules</summary>
        <ul className="rules">
          {RULES.map((r) => (
            <li key={r.key}>
              <span>{r.text}</span>
              <span className={r.points > 0 ? 'pts-plus' : 'pts-minus'}>{signed(r.points)}</span>
            </li>
          ))}
        </ul>
        <p className="hint">
          80+ पॉइंट: 🌟 भरोसेमंद · {WARN_BELOW} से कम: ⚠️ जोखिम · {BLOCK_BELOW} से कम: 🚫 डिफॉल्टर (ब्लॉक) /
          80+ points: Trusted · below {WARN_BELOW}: Risky · below {BLOCK_BELOW}: Defaulter (blocked)
        </p>

        {trust.log.length > 0 && (
          <>
            <strong>इतिहास / History</strong>
            <ul className="rules">
              {trust.log.slice(0, 5).map((e, i) => (
                <li key={i}>
                  <span>{REASONS[e.reason]}</span>
                  <span className={e.delta > 0 ? 'pts-plus' : 'pts-minus'}>{signed(e.delta)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </details>
    </section>
  )
}
