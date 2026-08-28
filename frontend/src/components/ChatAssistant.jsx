import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { apiRequest } from '../services/apiClient.js'
import './ChatAssistant.css'

const STORAGE_KEY = 'eventhive-chatbot-session-v1'
const MAX_UI_HISTORY = 8
const QUICK_PROMPTS = [
  'What events are trending?',
  'What does the community want?',
  'Show me upcoming events',
]

function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    if (saved?.conversationId && Array.isArray(saved.history)) return saved
  } catch {
    // Start a clean session when stored state is unavailable or malformed.
  }
  return { conversationId: null, history: [] }
}

function makeUserMessage(content) {
  return { role: 'user', content, id: `user-${Date.now()}` }
}

function makeAssistantMessage(content, metadata = {}) {
  return { role: 'assistant', content, id: `assistant-${Date.now()}-${Math.random()}`, metadata }
}

export default function ChatAssistant() {
  const initial = useMemo(loadSession, [])
  const [open, setOpen] = useState(false)
  const [conversationId, setConversationId] = useState(initial.conversationId)
  const [messages, setMessages] = useState(initial.history)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      conversationId,
      history: messages.slice(-MAX_UI_HISTORY),
    }))
  }, [conversationId, messages])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    inputRef.current?.focus()
  }, [open, messages, loading])

  async function sendMessage(value = input) {
    const message = value.trim()
    if (!message || loading) return

    setError('')
    setInput('')
    const userMessage = makeUserMessage(message)
    const priorHistory = messages.slice(-MAX_UI_HISTORY).map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, userMessage])
    setLoading(true)

    try {
      const payload = await apiRequest('/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversationId,
          history: priorHistory,
        }),
      })

      if (payload?.conversationId) setConversationId(payload.conversationId)
      const assistantText = payload?.response || 'I could not produce a response for that request.'
      setMessages((current) => [...current, makeAssistantMessage(assistantText, {
        intent: payload?.intent,
        grounded: payload?.grounded,
        tool: payload?.tool,
      })])
    } catch (requestError) {
      setError(requestError.message || 'Unable to reach the EventHive Assistant.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage()
  }

  function clearConversation() {
    setConversationId(null)
    setMessages([])
    setError('')
    sessionStorage.removeItem(STORAGE_KEY)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <>
      {open && (
        <section className="eventhive-chat" aria-label="EventHive Assistant">
          <header className="eventhive-chat__header">
            <div className="eventhive-chat__identity">
              <span className="eventhive-chat__avatar" aria-hidden="true"><Bot size={19} /></span>
              <div>
                <strong>EventHive Assistant</strong>
                <span>Local event intelligence</span>
              </div>
            </div>
            <div className="eventhive-chat__actions">
              <button type="button" onClick={clearConversation} aria-label="Clear conversation" title="Clear conversation">
                <RotateCcw size={17} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" title="Close assistant">
                <X size={19} />
              </button>
            </div>
          </header>

          <div className="eventhive-chat__body" aria-live="polite">
            {!messages.length && (
              <div className="eventhive-chat__welcome">
                <span className="eventhive-chat__welcome-icon"><Sparkles size={20} /></span>
                <h2>Ask about your local events</h2>
                <p>I can find upcoming events, explain local trends, and summarize community demand.</p>
                <div className="eventhive-chat__quick-prompts">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>{prompt}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`eventhive-chat__message eventhive-chat__message--${message.role}`}>
                {message.role === 'assistant' && <span className="eventhive-chat__message-icon" aria-hidden="true"><Bot size={14} /></span>}
                <div className="eventhive-chat__bubble">{message.content}</div>
              </div>
            ))}

            {loading && (
              <div className="eventhive-chat__message eventhive-chat__message--assistant">
                <span className="eventhive-chat__message-icon" aria-hidden="true"><Bot size={14} /></span>
                <div className="eventhive-chat__bubble eventhive-chat__typing" aria-label="Assistant is responding">
                  <span /><span /><span />
                </div>
              </div>
            )}
            {error && <p className="eventhive-chat__error" role="alert">{error}</p>}
            <div ref={endRef} />
          </div>

          <form className="eventhive-chat__composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="eventhive-chat-input">Message EventHive Assistant</label>
            <input
              id="eventhive-chat-input"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about events or trends..."
              maxLength={1000}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send message" title="Send message">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      {!open && (
        <button className="eventhive-chat__launcher" type="button" onClick={() => setOpen(true)} aria-label="Open EventHive Assistant">
          <MessageCircle size={22} />
          <span>Ask EventHive</span>
        </button>
      )}
    </>
  )
}
