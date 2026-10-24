import { useRef, useState } from 'react'
import { SERVICES } from '../data/services'

// Chrome and Edge have this. Firefox does not.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

// Mic button + text box. Shows what the customer said and the detected service.
export default function CustomerScreen({ onSearch, result }) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recRef = useRef(null)

  // Start or stop the microphone
  function toggleMic() {
    if (listening) {
      recRef.current?.stop()
      return
    }
    setError('')
    const rec = new SpeechRecognition()
    rec.lang = 'hi-IN' // Hindi (India)
    rec.interimResults = true
    rec.onstart = () => setListening(true)
    rec.onresult = (event) => {
      let spoken = ''
      for (let i = 0; i < event.results.length; i++) {
        spoken += event.results[i][0].transcript
      }
      setText(spoken)
      // When the browser is sure about the words, search
      if (event.results[event.results.length - 1].isFinal) onSearch(spoken)
    }
    rec.onerror = (event) => {
      if (event.error === 'not-allowed') setError('माइक की अनुमति दें / Please allow the microphone.')
      else if (event.error === 'no-speech') setError('कुछ सुनाई नहीं दिया। फिर बोलें / Did not hear anything. Try again.')
      else setError('माइक में दिक्कत / Mic problem: ' + event.error)
    }
    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
  }

  // Search from the text box
  function handleSubmit(e) {
    e.preventDefault()
    if (text.trim()) onSearch(text.trim())
  }

  return (
    <section className="panel">
      <div className="mic-wrap">
        <button
          className={'mic' + (listening ? ' listening' : '')}
          onClick={toggleMic}
          disabled={!SpeechRecognition}
          aria-label="Microphone"
        >
          🎤
        </button>
        <p className="hint">
          {!SpeechRecognition
            ? 'इस ब्राउज़र में माइक नहीं चलता। नीचे लिखें / Mic not supported here. Please type below.'
            : listening
            ? 'सुन रहा हूँ... / Listening...'
            : 'दबाओ और अपनी समस्या बोलो / Tap and speak your problem'}
        </p>
        {error && <p className="error">{error}</p>}
      </div>

      <form className="row" onSubmit={handleSubmit}>
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="जैसे: नल लीक हो रहा है / e.g. tap is leaking"
        />
        <button className="btn btn-primary" type="submit">ढूंढो / Find</button>
      </form>

      {result && (
        <div className="said">
          <small>आपने कहा / You said:</small>
          <q>{result.text}</q>
          <div className="badges">
            {result.service ? (
              <span className="badge badge-orange">
                {SERVICES[result.service].emoji} {SERVICES[result.service].hi} / {SERVICES[result.service].en}
              </span>
            ) : (
              <span className="badge badge-red">सेवा समझ नहीं आई / Service not found</span>
            )}
            {result.urgent && <span className="badge badge-red">🚨 जरूरी / Urgent</span>}
          </div>
        </div>
      )}
    </section>
  )
}
