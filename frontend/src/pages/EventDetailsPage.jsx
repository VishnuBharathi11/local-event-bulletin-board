import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  User,
  Users,
  Share2,
} from 'lucide-react'
import CategoryBadge from '../components/events/CategoryBadge.jsx'
import EventStatusBadge from '../components/events/EventStatusBadge.jsx'
import EventDetailMap from '../components/events/EventDetailMap.jsx'
import { useEvent } from '../hooks/useEvent.js'
import { useEventRSVP } from '../hooks/useEventRSVP.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'
import { isPincode } from '../utils/eventDiscovery.js'
import {
  getEventLifecycleStatus,
  getNextEventLifecycleBoundary,
} from '../utils/eventLifecycle.js'
import { shareEvent } from '../utils/eventShare.js'
import '../styles/eventDetails.css'

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { status, event, error } = useEvent(eventId)
  const { authenticated, currentUser } = useAuth()
  const rsvp = useEventRSVP(eventId, authenticated, event?.rsvpCount)
  const [lifecycleStatus, setLifecycleStatus] = useState(() =>
    getEventLifecycleStatus(event)
  )
  const [imageError, setImageError] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')

  const leftCardRef = useRef(null)
  const [leftHeight, setLeftHeight] = useState(null)

  useEffect(() => {
    if (!event) return undefined
    let timerId
    let cancelled = false
    const updateLifecycle = () => {
      if (cancelled) return
      const nextStatus = getEventLifecycleStatus(event)
      setLifecycleStatus(nextStatus)
      const boundary = getNextEventLifecycleBoundary(event)
      if (boundary)
        timerId = window.setTimeout(
          updateLifecycle,
          Math.max(boundary - Date.now(), 0) + 50
        )
    }
    updateLifecycle()
    return () => {
      cancelled = true
      if (timerId) window.clearTimeout(timerId)
    }
  }, [event])

  const rsvpCount = rsvp.hasCount ? rsvp.rsvpCount : (Number(event?.rsvpCount) || 0)

  useEffect(() => {
    if (!leftCardRef.current) return undefined
    const updateHeight = () => {
      if (leftCardRef.current) {
        setLeftHeight(leftCardRef.current.offsetHeight)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(leftCardRef.current)
    return () => {
      window.removeEventListener('resize', updateHeight)
      resizeObserver.disconnect()
    }
  }, [event, rsvpCount, lifecycleStatus, imageError])

  if (status === 'loading') {
    return (
      <div className="state-card state-card--loading" role="status">
        <div className="state-card__icon" aria-hidden="true">
          ◌
        </div>
        <strong>Loading event…</strong>
        <span>Retrieving event details.</span>
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className="state-card state-card--error">
        <div className="state-card__icon" aria-hidden="true">
          !
        </div>
        <strong>Event not found</strong>
        <span>The requested event does not exist or is no longer available.</span>
        <Link className="secondary-link" to="/">
          Back to Event Board
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="state-card state-card--error" role="alert">
        <div className="state-card__icon" aria-hidden="true">
          !
        </div>
        <strong>Unable to load event</strong>
        <span>{error}</span>
        <Link className="secondary-link" to="/">
          Back to Event Board
        </Link>
      </div>
    )
  }

  const isOngoing = lifecycleStatus === 'ACTIVE'
  const isOwner = currentUser?.userId === event.organizerId
  const cleanLocalityList = [event.neighborhood, event.city]
    .filter(Boolean)
    .filter((val) => !isPincode(val))
  const rsvpLabel =
    rsvpCount === 1 ? '1 person going' : `${rsvpCount} people going`

  async function handleGoingToggle() {
    if (!authenticated) {
      navigate('/login')
      return
    }

    if (rsvp.going) {
      await rsvp.setNotGoing()
    } else {
      await rsvp.setGoing()
    }
  }

  async function handleShare(e) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const result = await shareEvent(event)
      if (result?.message) {
        setShareFeedback(result.message)
        setTimeout(() => setShareFeedback(''), 2500)
      }
    } catch {
      setShareFeedback('Unable to share')
      setTimeout(() => setShareFeedback(''), 2500)
    }
  }

  return (
    <article className="event-details">
      <div className="event-details__container">
        {/* ==================================================================
            LEFT COLUMN: EVENT SUMMARY CARD
           ================================================================== */}
        <aside className="event-details__left">
          <div className="event-details__left-card" ref={leftCardRef}>
            {/* Top Back Link */}
            <Link className="event-details__back-link" to="/">
              <ArrowLeft size={16} strokeWidth={2.4} />
              <span>Back to Event Board</span>
            </Link>

            {/* Event Image */}
            <div className="event-details__image-wrap">
              {event.imageUrl && !imageError ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="event-details__image"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="event-details__image-fallback">
                  <span>EH</span>
                </div>
              )}
            </div>

            {/* Category Pill (Left) + Published Status (Right) */}
            <div className="event-details__badges-row">
              <CategoryBadge category={event.category || 'Music'} />
              <EventStatusBadge status={lifecycleStatus} />
            </div>

            {/* Event Title */}
            <h1 className="event-details__title">{event.title}</h1>

            {/* Organizer Row */}
            <div className="event-details__organizer-row">
              <User size={15} strokeWidth={2.2} className="event-details__organizer-icon" />
              <span className="event-details__organizer-by">By</span>
              <span className="event-details__organizer-name">
                {event.organizerName || 'Divyaaa'}
              </span>
            </div>

            {/* Date and Time Rows */}
            <div className="event-details__datetime-row">
              <CalendarDays size={15} strokeWidth={2.2} className="event-details__datetime-icon" />
              <span>{formatDate(event.startTime)}</span>
            </div>
            <div className="event-details__datetime-row" style={{ marginTop: '6px' }}>
              <Clock3 size={15} strokeWidth={2.2} className="event-details__datetime-icon" />
              <span>{formatEventTimeRange(event.startTime, event.endTime)}</span>
            </div>

            {/* Location Container Box (without View on Map button) */}
            <div className="event-details__location-box">
              <div className="event-details__location-box-left">
                <div className="event-details__pin-badge">
                  <MapPin size={18} strokeWidth={2.4} />
                </div>
                <div className="event-details__location-box-info">
                  <strong>{event.location}</strong>
                  <small>{cleanLocalityList.join(', ')}</small>
                </div>
              </div>
            </div>

            {/* Attendee / Going Section (Clean Text + Functional Going Button + Share Button) */}
            <div className="event-details__attendee-row">
              <div className="event-details__attendee-info">
                <Users size={16} strokeWidth={2.2} />
                <span>{rsvpLabel}</span>
              </div>

              {/* Action Buttons: Going Button + Share Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="event-details__going-btn-wrap">
                  {isOwner ? (
                    <span className="event-details__going-btn" style={{ cursor: 'default' }}>
                      Organizer
                    </span>
                  ) : isOngoing ? (
                    <button
                      type="button"
                      className="event-details__going-btn"
                      disabled
                    >
                      <span>Ongoing</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`event-details__going-btn ${rsvp.going ? 'event-details__going-btn--active' : ''}`}
                      disabled={rsvp.isBusy}
                      onClick={handleGoingToggle}
                      title={authenticated ? (rsvp.going ? 'Click to cancel RSVP' : 'Click to RSVP') : 'Login to RSVP'}
                    >
                      <span>
                        {rsvp.isBusy
                          ? '…'
                          : rsvp.going
                          ? 'Going'
                          : "I'm Going"}
                      </span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="event-details__share-btn"
                  onClick={handleShare}
                  aria-label="Share event"
                  title={shareFeedback || "Share event"}
                >
                  <Share2 size={16} strokeWidth={2} />
                </button>
              </div>
            </div>

            {shareFeedback && (
              <p className="event-card__share-toast" role="status" aria-live="polite">
                {shareFeedback}
              </p>
            )}

            {rsvp.status === 'error' && (
              <p className="action-message action-message--error" role="alert">
                {rsvp.error}
              </p>
            )}
          </div>
        </aside>

        {/* ==================================================================
            RIGHT COLUMN: EVENT OVERVIEW & LOCATION CARD
           ================================================================== */}
        <section className="event-details__right">
          <div
            className="event-details__right-card"
            style={leftHeight ? { height: `${leftHeight}px`, maxHeight: `${leftHeight}px` } : undefined}
          >
            {/* EVENT OVERVIEW Section */}
            <div>
              <span className="event-details__section-eyebrow">
                EVENT OVERVIEW
              </span>
              <div className="event-details__overview-header">
                <div className="event-details__section-icon-box">
                  <FileText size={16} strokeWidth={2.2} />
                </div>
                <h2>About this event</h2>
              </div>
              <p className="event-details__description-text">
                {event.description}
              </p>
            </div>

            {/* LOCATION Section */}
            <div>
              <div className="event-details__location-header">
                <div className="event-details__location-header-left">
                  <div className="event-details__section-icon-box">
                    <MapPin size={16} strokeWidth={2.2} />
                  </div>
                  <div className="event-details__location-titles">
                    <span className="event-details__section-eyebrow">
                      LOCATION
                    </span>
                    <h3 className="event-details__venue-title">
                      {event.location}
                    </h3>
                    <p className="event-details__venue-address">
                      {cleanLocalityList.join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map & Get Directions */}
              <EventDetailMap event={event} />
            </div>
          </div>
        </section>
      </div>
    </article>
  )
}
