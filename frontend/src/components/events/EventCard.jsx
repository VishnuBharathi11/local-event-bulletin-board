import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, MapPin, User, Share2 } from 'lucide-react'
import CategoryBadge from './CategoryBadge.jsx'
import EventStatusBadge from './EventStatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useEventRSVP } from '../../hooks/useEventRSVP.js'
import { formatDate, formatEventTimeRange } from '../../utils/dateTime.js'
import { isPincode } from '../../utils/eventDiscovery.js'
import { getEventLifecycleStatus, getNextEventLifecycleBoundary } from '../../utils/eventLifecycle.js'
import { shareEvent } from '../../utils/eventShare.js'

export default function EventCard({
  event,
  onExpired,
  isManagement = false,
  onEdit,
  onDelete,
  isDeleting = false,
  style = {}
}) {
  const { authenticated, currentUser } = useAuth()
  const rsvp = useEventRSVP(event.eventId, authenticated, event.rsvpCount)
  const [imageError, setImageError] = useState(false)
  const [lifecycleStatus, setLifecycleStatus] = useState(() => getEventLifecycleStatus(event))
  const [shareFeedback, setShareFeedback] = useState('')

  useEffect(() => {
    let timerId
    let cancelled = false

    const updateLifecycle = () => {
      if (cancelled) return
      const nextStatus = getEventLifecycleStatus(event)
      setLifecycleStatus(nextStatus)
      if (nextStatus === 'EXPIRED') {
        onExpired?.(event.eventId)
        return
      }
      const boundary = getNextEventLifecycleBoundary(event)
      if (boundary) timerId = window.setTimeout(updateLifecycle, Math.max(boundary - Date.now(), 0) + 50)
    }

    updateLifecycle()
    return () => {
      cancelled = true
      if (timerId) window.clearTimeout(timerId)
    }
  }, [event.eventId, event.startTime, event.endTime, event.expireAt, onExpired])

  if (lifecycleStatus === 'EXPIRED' && !isManagement) return null

  const rsvpCount = rsvp.hasCount ? rsvp.rsvpCount : (Number(event.rsvpCount) || 0)
  const rsvpLabel = rsvpCount === 1 ? '1 person going' : `${rsvpCount} people going`
  const cleanLocalityList = [event.neighborhood, event.city].filter(Boolean).filter(val => !isPincode(val))
  const locationLabel = [event.location, ...cleanLocalityList].join(', ')
  const isOwner = currentUser?.userId === event.organizerId
  const canModify = event.startTime - Date.now() > 2 * 60 * 60 * 1000
  const isOngoing = lifecycleStatus === 'ACTIVE'

  async function handleGoing() {
    await rsvp.setGoing()
  }

  async function handleNotGoing() {
    await rsvp.setNotGoing()
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
    <article className="event-card" style={style}>
      {event.imageUrl && !imageError ? (
        <div className="event-card__image-wrap">
          <img src={event.imageUrl} alt={event.title} className="event-card__image" onError={() => setImageError(true)} />
        </div>
      ) : (
        <div className="event-card__image-wrap event-card__image-wrap--fallback">
          <div className="event-card__fallback-text">EH</div>
        </div>
      )}

      <div className="event-card__badges">
        <CategoryBadge category={event.category} />
        <EventStatusBadge status={lifecycleStatus} />
      </div>

      <h2 className="event-card__title" title={event.title}>{event.title}</h2>

      <div className="event-card__organizer" aria-label={`Organizer ${event.organizerName || 'Event Organizer'}`}>
        <User size={13} aria-hidden="true" />
        <span className="event-card__organizer-name">{event.organizerName || 'Event Organizer'}</span>
      </div>

      <div className="event-card__info-block">
        <div className="event-card__info-item">
          <CalendarDays size={14} aria-hidden="true" />
          <span className="event-card__datetime">
            <strong>{formatDate(event.startTime)}</strong>
          </span>
        </div>
        <div className="event-card__info-item">
          <Clock3 size={14} aria-hidden="true" />
          <span className="event-card__datetime">
            {formatEventTimeRange(event.startTime, event.endTime)}
          </span>
        </div>
      </div>

      <div className="event-card__location" title={locationLabel}>
        <MapPin size={15} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--brand)', marginTop: '1px' }} />
        <span className="event-card__location-text">
          <strong>{event.location}</strong>
          <small>{cleanLocalityList.join(' · ')}</small>
        </span>
      </div>

      <div className="event-card__footer">
        <span className="event-card__rsvp">{rsvpLabel}</span>
        <div className="event-card__actions">
          {isManagement ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              {canModify && <button className="secondary-button" type="button" onClick={onEdit} style={{ minHeight: '34px', padding: '0 10px', fontSize: '12px' }}>Edit</button>}
              {canModify && <button className="button-danger" type="button" disabled={isDeleting} onClick={onDelete} style={{ minHeight: '34px', padding: '0 10px', fontSize: '12px' }}>{isDeleting ? 'Deleting...' : 'Delete'}</button>}
              {!canModify && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Locked</span>}
            </div>
          ) : authenticated ? (
            !isOwner && (
              <div className="event-card__rsvp-action">
                {isOngoing ? (
                  <button className="secondary-button" type="button" disabled style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}>Ongoing</button>
                ) : rsvp.going ? (
                  <button className="secondary-button" type="button" disabled={rsvp.isBusy} onClick={handleNotGoing} style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}>{rsvp.isBusy ? '…' : 'Going'}</button>
                ) : (
                  <button className="primary-button" type="button" disabled={rsvp.isBusy} onClick={handleGoing} style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}>{rsvp.isBusy ? '…' : "I'm Going"}</button>
                )}
              </div>
            )
          ) : (
            <Link className="secondary-link" to="/login" style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}>Login</Link>
          )}

          <button
            type="button"
            className="event-card__share-btn"
            onClick={handleShare}
            aria-label="Share event"
            title={shareFeedback || "Share event"}
          >
            <Share2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {shareFeedback && (
        <p className="event-card__share-toast" role="status" aria-live="polite">
          {shareFeedback}
        </p>
      )}

      {rsvp.status === 'error' && <p className="action-message action-message--error" role="alert">{rsvp.error}</p>}
      <Link className="event-card__link" to={`/events/${encodeURIComponent(event.eventId)}`}>View Event <span aria-hidden="true">→</span></Link>
    </article>
  )
}
