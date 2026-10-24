import { useEffect, useRef, useState } from 'react'
import { sendMessage, startCall, OPEN_STATUSES } from '../store'

// Quick replies, so it is easy to talk about the price
const QUICK = {
  customer: [
    'क्या दाम कम हो सकता है? / Can you reduce the price?',
    'आप कब तक आओगे? / When can you come?',
  ],
  worker: [
    'ठीक है, यही मेरा फाइनल दाम है / OK, this is my final price',
    'मैं रास्ते में हूँ / I am on my way',
  ],
}

// Chat between customer and worker. Phone numbers are hidden.
// me = 'customer' or 'worker'
export default function ChatBox({ request, me, onClose }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const otherName = me === 'customer' ? request.workerName : 'ग्राहक / Customer'
  const closed = !OPEN_STATUSES.includes(request.status) // finished, cancelled or declined
  const callBusy = request.call && (request.call.status === 'ringing' || request.call.status === 'active')

  // Scroll to the newest message
  useEffect(() => {
    const box = listRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [request.messages.length])

  function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(request.id, me, text)
    setText('')
  }

  return (
    <div className="sheet chat">
      <div className="sheet-head">
        <strong>💬 {otherName}</strong>
        <div className="sheet-actions">
          <button className="btn btn-small btn-primary" disabled={callBusy || closed} onClick={() => startCall(request.id, me)}>
            📞 कॉल / Call
          </button>
          <button className="btn btn-small btn-light" onClick={onClose} aria-label="Close chat">✕</button>
        </div>
      </div>
      <p className="privacy">🔒 आपका फोन नंबर छिपा रहता है / Your phone number stays hidden</p>

      <div className="messages" ref={listRef}>
        {request.messages.length === 0 && (
          <p className="hint">दाम और समय की बात करें / Talk about price and time here.</p>
        )}
        {request.messages.map((m) =>
          m.from === 'system' ? (
            <div key={m.id} className="msg-system">{m.text}</div>
          ) : (
            <div key={m.id} className={'bubble ' + (m.from === me ? 'me' : 'them')}>{m.text}</div>
          )
        )}
      </div>

      {closed ? (
        <p className="hint">यह चैट बंद है / This chat is closed.</p>
      ) : (
        <>
          <div className="chips">
            {QUICK[me].map((q) => (
              <button key={q} type="button" className="chip" onClick={() => sendMessage(request.id, me, q)}>
                {q}
              </button>
            ))}
          </div>
          <form className="row" onSubmit={handleSend}>
            <input
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="संदेश लिखें / Type a message"
            />
            <button className="btn btn-primary" type="submit">भेजो / Send</button>
          </form>
        </>
      )}
    </div>
  )
}
