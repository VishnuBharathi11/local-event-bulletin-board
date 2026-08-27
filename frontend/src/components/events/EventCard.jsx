import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import CategoryBadge from './CategoryBadge.jsx'
import EventStatusBadge from './EventStatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useEventRSVP } from '../../hooks/useEventRSVP.js'
import { formatDate, formatEventTimeRange } from '../../utils/dateTime.js'
import { isPincode } from '../../utils/eventDiscovery.js'
import { getEventLifecycleStatus, getNextEventLifecycleBoundary } from '../../utils/eventLifecycle.js'

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
  const rsvp = useEventRSVP(event.eventId, authenticated)
  const [imageError, setImageError] = useState(false)
  const [rsvpCount, setRsvpCount] = useState(Number(event.rsvpCount) || 0)
  const [lifecycleStatus, setLifecycleStatus] = useState(() => getEventLifecycleStatus(event))

  useEffect(() => {
    setRsvpCount(Number(event.rsvpCount) || 0)
  }, [event.rsvpCount])

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
  }, [event, onExpired])

  if (lifecycleStatus === 'EXPIRED') return null

  const rsvpLabel = rsvpCount === 1 ? '1 person going' : `${rsvpCount} people going`
  const cleanLocalityList = [event.neighborhood, event.city].filter(Boolean).filter(val => !isPincode(val))
  const locationLabel = [event.location, ...cleanLocalityList].join(', ')
  const isOwner = currentUser?.userId === event.organizerId
  const canModify = event.startTime - Date.now() > 2 * 60 * 60 * 1000
  const isOngoing = lifecycleStatus === 'ACTIVE'

  async function handleGoing() {
    const success = await rsvp.setGoing()
    if (success) setRsvpCount((current) => current + 1)
  }

  async function handleNotGoing() {
    const success = await rsvp.setNotGoing()
    if (success) setRsvpCount((current) => Math.max(current - 1, 0))
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

      <h2 className="event-card__title">{event.title}</h2>

      <div className="event-card__organizer" aria-label={`Organizer ${event.organizerName || 'Event Organizer'}`}>
        <span>Organizer</span>
        <strong>{event.organizerName || 'Event Organizer'}</strong>
      </div>

      <div className="event-card__info-block">
        <p className="event-card__info-item"><CalendarDays size={14} aria-hidden="true" /><span>{formatDate(event.startTime)}</span></p>
        <p className="event-card__info-item"><Clock3 size={14} aria-hidden="true" /><span>{formatEventTimeRange(event.startTime, event.endTime)}</span></p>
      </div>

      <div className="event-card__location" title={locationLabel}>
        <MapPin size={16} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--brand)', marginTop: '2px' }} />
        <span className="event-card__location-text">
          <strong>{event.location}</strong>
          <small>{cleanLocalityList.join(' · ')}</small>
        </span>
      </div>

      <div className="event-card__footer">
        <span className="event-card__rsvp">{rsvpLabel}</span>
        {isManagement ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            {canModify && <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>}
            {canModify && <button className="button-danger" type="button" disabled={isDeleting} onClick={onDelete} style={{ minHeight: '38px', padding: '0 12px', fontSize: '13px' }}>{isDeleting ? 'Deleting...' : 'Delete'}</button>}
            {!canModify && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Locked</span>}
          </div>
        ) : authenticated ? (
          !isOwner && (
            <div className="event-card__rsvp-action">
              {isOngoing ? (
                <button className="secondary-button" type="button" disabled>Ongoing</button>
              ) : rsvp.going ? (
                <button className="secondary-button" type="button" disabled={rsvp.isBusy} onClick={handleNotGoing}>{rsvp.isBusy ? 'Updating…' : 'Going'}</button>
              ) : (
                <button className="primary-button" type="button" disabled={rsvp.isBusy} onClick={handleGoing}>{rsvp.isBusy ? 'Updating…' : "I'm Going"}</button>
              )}
            </div>
          )
        ) : (
          <Link className="secondary-link" to="/login">Login to RSVP</Link>
        )}
      </div>

      <Link className="event-card__link" to={`/events/${encodeURIComponent(event.eventId)}`}>View Event <span aria-hidden="true">→</span></Link>
    </article>
  )
}
