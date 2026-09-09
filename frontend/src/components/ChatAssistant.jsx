import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Activity,
  Bot,
  Calendar,
  ChevronRight,
  Compass,
  GraduationCap,
  Handshake,
  Lightbulb,
  Map,
  MapPin,
  MessageCircle,
  Music,
  RotateCcw,
  Send,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  X
} from 'lucide-react'
import { apiRequest } from '../services/apiClient.js'
import { getEvents } from '../services/eventService.js'
import chatbotLogo from '../assets/chatbotlogo.svg'
import './ChatAssistant.css'

const STORAGE_KEY = 'eventhive-chatbot-session-v5'
const MAX_UI_HISTORY = 10

const BASIC_QUESTIONS = [
  { text: 'What events are trending?', icon: TrendingUp, desc: 'View live trending categories and going' },
  { text: 'Top events this week', icon: Calendar, desc: 'Discover real upcoming events' },
  { text: 'What does the community want?', icon: Lightbulb, desc: 'Explore community event requests' },
  { text: 'Events near me', icon: Compass, desc: 'Find local happenings from database' },
  { text: 'Popular categories', icon: Tag, desc: 'Browse all event categories' }
]

const CATEGORY_STYLE_CONFIG = {
  'workshops': { name: 'Workshops', iconType: 'workshops', bg: '#ede9fe', color: '#6d28d9' },
  'student events': { name: 'Student Events', iconType: 'student', bg: '#dcfce7', color: '#16a34a' },
  'student': { name: 'Student Events', iconType: 'student', bg: '#dcfce7', color: '#16a34a' },
  'meetups': { name: 'Meetups', iconType: 'meetups', bg: '#ffedd5', color: '#ea580c' },
  'community': { name: 'Community', iconType: 'community', bg: '#dbeafe', color: '#2563eb' },
  'sports': { name: 'Sports', iconType: 'sports', bg: '#ffe4e6', color: '#e11d48' },
  'music': { name: 'Music', iconType: 'music', bg: '#f3e8ff', color: '#9333ea' },
  'garage sale': { name: 'Garage Sale', iconType: 'garage-sale', bg: '#d1fae5', color: '#059669' }
}

const STANDARD_CATEGORIES = [
  'Workshops',
  'Student Events',
  'Meetups',
  'Community',
  'Sports',
  'Music',
  'Garage Sale'
]

function renderCategoryIcon(type, color) {
  switch (type) {
    case 'workshops':
      return <GraduationCap size={18} color={color} strokeWidth={2.2} />
    case 'student':
      return <Users size={18} color={color} strokeWidth={2.2} />
    case 'meetups':
      return <Handshake size={18} color={color} strokeWidth={2.2} />
    case 'community':
      return <Users size={18} color={color} strokeWidth={2.2} />
    case 'sports':
      return <Activity size={18} color={color} strokeWidth={2.2} />
    case 'music':
      return <Music size={18} color={color} strokeWidth={2.2} />
    case 'garage-sale':
      return <Tag size={18} color={color} strokeWidth={2.2} />
    default:
      return <Activity size={18} color={color} strokeWidth={2.2} />
  }
}

function computeCategoriesFromEvents(events = []) {
  const counts = {}
  const rsvps = {}

  events.forEach((evt) => {
    const rawCat = (evt.category || 'Community').toLowerCase().trim()
    const cfg = CATEGORY_STYLE_CONFIG[rawCat]
    const mapped = cfg ? cfg.name : 'Community'
    counts[mapped] = (counts[mapped] || 0) + 1
    const rsvpCount = Array.isArray(evt.rsvps)
      ? evt.rsvps.length
      : Number(evt.rsvpCount || evt.attendeesCount || evt.attendees?.length) || 0
    rsvps[mapped] = (rsvps[mapped] || 0) + rsvpCount
  })

  let maxActivity = -1
  let highDemandCategory = null
  STANDARD_CATEGORIES.forEach((name) => {
    const act = (counts[name] || 0) * 3 + (rsvps[name] || 0)
    if (act > maxActivity && (counts[name] || 0) > 0) {
      maxActivity = act
      highDemandCategory = name
    }
  })

  return STANDARD_CATEGORIES.map((name) => {
    const evCount = counts[name] || 0
    const rsvpTotal = rsvps[name] || 0
    const key = name.toLowerCase()
    const cfg = CATEGORY_STYLE_CONFIG[key] || { iconType: 'community', bg: '#dbeafe', color: '#2563eb' }
    return {
      name,
      events: `${evCount} ${evCount === 1 ? 'event' : 'events'}`,
      rsvps: `${rsvpTotal} going`,
      rawCount: evCount,
      rawRsvps: rsvpTotal,
      iconType: cfg.iconType,
      bg: cfg.bg,
      color: cfg.color,
      highDemand: name === highDemandCategory && evCount > 0
    }
  })
}

function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    if (saved?.conversationId && Array.isArray(saved.history) && saved.history.length > 0) return saved
  } catch {
    // Start clean
  }
  return { conversationId: null, history: [] }
}

function makeUserMessage(content) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return { role: 'user', content, id: `user-${Date.now()}`, timestamp: timeStr }
}

export default function ChatAssistant() {
  const navigate = useNavigate()
  const location = useLocation()
  const initial = useMemo(loadSession, [])
  const [open, setOpen] = useState(false)
  const [conversationId, setConversationId] = useState(initial.conversationId)
  const [messages, setMessages] = useState(initial.history)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cachedEvents, setCachedEvents] = useState([])
  const endRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch real events from database
  useEffect(() => {
    async function loadEventsData() {
      try {
        const data = await getEvents()
        if (Array.isArray(data)) {
          setCachedEvents(data)
        }
      } catch (err) {
        console.warn('ChatAssistant: Failed to load events from DB', err)
      }
    }
    loadEventsData()
  }, [open])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      conversationId,
      history: messages.slice(-MAX_UI_HISTORY),
    }))
  }, [conversationId, messages])

  useEffect(() => {
    if (open) {
      document.body.classList.add('chat-assistant-open')
    } else {
      document.body.classList.remove('chat-assistant-open')
    }
    return () => document.body.classList.remove('chat-assistant-open')
  }, [open])

  useEffect(() => {
    // If user returned back after opening an event from the chatbot
    const shouldReopen = sessionStorage.getItem('eventhive-reopen-chat-on-back')
    if (shouldReopen === 'true' && !location.pathname.startsWith('/events/')) {
      sessionStorage.removeItem('eventhive-reopen-chat-on-back')
      setOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    inputRef.current?.focus()
  }, [open, messages, loading])

  function handleOpenMap() {
    setOpen(false)
    if (location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/event-board') {
      navigate('/?view=map')
    }
    window.dispatchEvent(new CustomEvent('eventhive:open-map'))
  }

  async function sendMessage(value) {
    const raw = typeof value === 'string' ? value : input
    const message = (raw || '').trim()
    if (!message || loading) return

    setError('')
    setInput('')
    const userMessage = makeUserMessage(message)
    const priorHistory = messages.slice(-MAX_UI_HISTORY).map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, userMessage])
    setLoading(true)

    // Ensure we have fresh events from the database
    let liveEvents = cachedEvents
    try {
      const fresh = await getEvents()
      if (Array.isArray(fresh)) {
        liveEvents = fresh
        setCachedEvents(fresh)
      }
    } catch {
      // Use cached if offline
    }

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    const lower = message.toLowerCase()

    // Determine inquiry type
    const isTrendingQuery = lower.includes('trending') || lower.includes('popular') || lower.includes('categories')
    const isEventsListQuery = lower.includes('top events') || lower.includes('upcoming') || lower.includes('events near me') || lower.includes('show me')

    // Find if specific category is requested
    const targetCategory = STANDARD_CATEGORIES.find((cat) => lower.includes(cat.toLowerCase()))

    try {
      if (isTrendingQuery && !targetCategory) {
        // Return live category aggregation computed from real database
        const liveCategories = computeCategoriesFromEvents(liveEvents)
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            id: `assistant-${Date.now()}`,
            content: 'Based on recent activity, the following categories are trending:',
            categories: liveCategories,
            timestamp: timeStr
          }
        ])
      } else if (targetCategory || isEventsListQuery) {
        // Filter live events from the database
        let matching = liveEvents
        if (targetCategory) {
          matching = liveEvents.filter(
            (e) => (e.category || '').toLowerCase().trim() === targetCategory.toLowerCase()
          )
        }

        const displayEvents = matching.slice(0, 5)

        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            id: `assistant-${Date.now()}`,
            content: targetCategory
              ? `Here are upcoming ${targetCategory} events from the database:`
              : 'Here are the top upcoming events in your community:',
            eventCards: displayEvents.map((evt) => ({
              id: evt.eventId || evt.id,
              title: evt.title,
              category: evt.category || 'Community',
              date: evt.startTime ? new Date(Number(evt.startTime) || evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Upcoming',
              location: evt.location || evt.district || evt.city || 'Local Area',
              rsvps: Array.isArray(evt.rsvps) ? evt.rsvps.length : (Number(evt.rsvpCount || evt.attendees?.length) || 0)
            })),
            timestamp: timeStr
          }
        ])
      } else {
        // Call backend assistant API
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
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            id: `assistant-${Date.now()}`,
            content: assistantText,
            timestamp: timeStr
          }
        ])
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to reach the EventHive Assistant.')
    } finally {
      setLoading(false)
    }
  }

  function handleCategoryClick(catName) {
    sendMessage(`Show me ${catName} events`)
  }

  function handleEventCardClick(eventId) {
    sessionStorage.setItem('eventhive-reopen-chat-on-back', 'true')
    setOpen(false)
    navigate(`/events/${encodeURIComponent(eventId)}`, {
      state: { fromChat: true }
    })
  }

  function handleSubmit(event) {
    if (event?.preventDefault) event.preventDefault()
    if (event?.stopPropagation) event.stopPropagation()
    const text = input.trim()
    if (!text || loading) return
    sendMessage(text)
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
          {/* Side floating actions anchored to the LEFT of the chatbot panel */}
          <div className="eventhive-chat__side-actions" aria-label="Quick actions">
            <button
              className="eventhive-chat__side-action eventhive-chat__side-action--chat"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="EventHive Assistant (Open)"
              title="Close Assistant"
            >
              <Bot size={20} />
            </button>
            <button
              className="eventhive-chat__side-action eventhive-chat__side-action--map"
              type="button"
              onClick={handleOpenMap}
              aria-label="See Map"
              title="See Map"
            >
              <Map size={19} />
            </button>
          </div>

          {/* Top Header */}
          <header className="eventhive-chat__header">
            <div className="eventhive-chat__identity">
              <div className="eventhive-chat__avatar-wrap">
                <img src={chatbotLogo} alt="" className="eventhive-chat__avatar-img" />
                <span className="eventhive-chat__status-dot" aria-label="Online" />
              </div>
              <div className="eventhive-chat__identity-text">
                <strong>EventHive Assistant</strong>
                <span>Your smart event companion</span>
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
            {/* Empty State with Basic Suggested Questions */}
            {messages.length === 0 && (
              <div className="eventhive-chat__empty-state">
                <div className="eventhive-chat__empty-hero">
                  <div className="eventhive-chat__empty-badge">
                    <img src={chatbotLogo} alt="" className="eventhive-chat__empty-logo" />
                  </div>
                  <h3 className="eventhive-chat__empty-title">How can I help you today?</h3>
                  <p className="eventhive-chat__empty-subtitle">
                    Select a question below or ask anything about local events, workshops, and community demand.
                  </p>
                </div>

                <div className="eventhive-chat__questions-list">
                  <span className="eventhive-chat__questions-label">Suggested Questions</span>
                  {BASIC_QUESTIONS.map((q, idx) => {
                    const IconComp = q.icon
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="eventhive-chat__question-card"
                        onClick={() => sendMessage(q.text)}
                      >
                        <div className="eventhive-chat__q-icon-wrap">
                          <IconComp size={16} />
                        </div>
                        <div className="eventhive-chat__q-info">
                          <span className="eventhive-chat__q-text">{q.text}</span>
                          <span className="eventhive-chat__q-desc">{q.desc}</span>
                        </div>
                        <ChevronRight size={16} className="eventhive-chat__q-chevron" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`eventhive-chat__message-wrapper eventhive-chat__message-wrapper--${message.role}`}>
                {message.role === 'user' ? (
                  <div className="eventhive-chat__user-bubble">
                    <p className="eventhive-chat__user-text">{message.content}</p>
                    {/* Timestamp without double checkmark */}
                    <div className="eventhive-chat__user-meta">
                      <span>{message.timestamp || '10:30 AM'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="eventhive-chat__assistant-row">
                    <div className="eventhive-chat__assistant-avatar-badge" aria-hidden="true">
                      <img src={chatbotLogo} alt="" className="eventhive-chat__assistant-avatar-logo" />
                    </div>

                    <div className="eventhive-chat__assistant-card-container">
                      <div className="eventhive-chat__assistant-card">
                        <p className="eventhive-chat__card-intro">{message.content}</p>

                        {/* Live Trending Categories from Database */}
                        {message.categories && (
                          <div className="eventhive-chat__categories-list">
                            {message.categories.map((cat, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="eventhive-chat__category-item"
                                onClick={() => handleCategoryClick(cat.name)}
                              >
                                <div className="eventhive-chat__cat-left">
                                  <div
                                    className="eventhive-chat__cat-icon-badge"
                                    style={{ backgroundColor: cat.bg }}
                                  >
                                    {renderCategoryIcon(cat.iconType, cat.color)}
                                  </div>
                                  <div className="eventhive-chat__cat-details">
                                    <strong className="eventhive-chat__cat-name">{cat.name}</strong>
                                    <span className="eventhive-chat__cat-stats">{cat.events} • {cat.rsvps}</span>
                                    {cat.highDemand && (
                                      <div className="eventhive-chat__demand-pill">
                                        <TrendingUp size={12} />
                                        <span>High demand</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight size={17} className="eventhive-chat__chevron" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Live Event Cards from Database */}
                        {message.eventCards && message.eventCards.length > 0 && (
                          <div className="eventhive-chat__events-grid">
                            {message.eventCards.map((evt) => (
                              <div
                                key={evt.id}
                                className="eventhive-chat__event-card-item"
                                onClick={() => handleEventCardClick(evt.id)}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="eventhive-chat__event-card-header">
                                  <span className="eventhive-chat__event-cat-tag">{evt.category}</span>
                                  <span className="eventhive-chat__event-rsvp-tag">{evt.rsvps} going</span>
                                </div>
                                <strong className="eventhive-chat__event-title">{evt.title}</strong>
                                <div className="eventhive-chat__event-footer">
                                  <span className="eventhive-chat__event-date">📅 {evt.date}</span>
                                  <span className="eventhive-chat__event-loc">📍 {evt.location}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="eventhive-chat__assistant-timestamp">
                        {message.timestamp || '10:30 AM'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="eventhive-chat__assistant-row">
                <div className="eventhive-chat__assistant-avatar-badge" aria-hidden="true">
                  <img src={chatbotLogo} alt="" className="eventhive-chat__assistant-avatar-logo" />
                </div>
                <div className="eventhive-chat__assistant-card eventhive-chat__typing" aria-label="Assistant is responding">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {error && <p className="eventhive-chat__error" role="alert">{error}</p>}
            <div ref={endRef} />
          </div>

          {/* Composer Footer */}
          <div className="eventhive-chat__composer">
            <div className="eventhive-chat__input-wrapper">
              <label className="sr-only" htmlFor="eventhive-chat-input">Ask about events or trends...</label>
              <input
                id="eventhive-chat-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSubmit(e)
                  }
                }}
                placeholder="Ask about events or trends..."
                maxLength={1000}
                disabled={loading}
              />
            </div>
            <button
              type="button"
              className="eventhive-chat__send-btn"
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              title="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </section>
      )}

      {!open && (
        <button
          className="eventhive-chat__launcher"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open EventHive Assistant"
        >
          <MessageCircle size={22} />
          <span>Ask EventHive</span>
        </button>
      )}
    </>
  )
}
