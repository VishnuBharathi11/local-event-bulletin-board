import { useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryBadge from './CategoryBadge.jsx'
import EventStatusBadge from './EventStatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useEventRSVP } from '../../hooks/useEventRSVP.js'
import { formatDate, formatEventTimeRange } from '../../utils/dateTime.js'

export default function EventCard({
  event,
  onRsvpChanged,
  isManagement = false,
  onEdit,
  onDelete,
  isDeleting = false
}) {
  const { authenticated, currentUser } = useAuth()
  const rsvp = useEventRSVP(event.eventId, authenticated)
  const [imageError, setImageError] = useState(false)

  const rsvpLabel = event.rsvpCount === 1 ? '1 person going' : `${event.rsvpCount} people going`
  const locationLabel = [event.location, event.neighborhood, event.city].filter(Boolean).join(', ')

  const isOwner = currentUser?.userId === event.organizerId
  const canModify = isOwner && (event.startTime - Date.now() > 2 * 60 * 60 * 1000)

  async function handleGoing() {
    const success = await rsvp.setGoing()
    if (success) await onRsvpChanged?.()
  }

  async function handleNotGoing() {
    const success = await rsvp.setNotGoing()
    if (success) await onRsvpChanged?.()
  }

  return (
    <article className="event-card">
      {event.imageUrl && !imageError ? (
        <div className="event-card__image-wrap">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="event-card__image"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="event-card__image-wrap" style={{ background: 'linear-gradient(145deg, #eef3fa, #f8fafc)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', opacity: 0.2 }}>EH</div>
        </div>
      )}
      <div className="event-card__badges">
        <CategoryBadge category={event.category} />
        <EventStatusBadge status={event.status} />
      </div>

      <h2 className="event-card__title">{event.title}</h2>
      <p className="event-card__date">{formatDate(event.startTime)}</p>
      <p className="event-card__time">{formatEventTimeRange(event.startTime, event.endTime)}</p>

      <div className="event-card__location" title={locationLabel}>
        <span className="event-card__location-icon" aria-hidden="true">⌖</span>
        <span className="event-card__location-text">
          <strong>{event.location}</strong>
          <small>{[event.neighborhood, event.city].filter(Boolean).join(' · ')}</small>
        </span>
      </div>

      <div className="event-card__footer">
        <span className="event-card__rsvp">{rsvpLabel}</span>
        {isManagement ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            {canModify && (
              <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>
            )}
            {canModify && (
              <button
                className="button-danger"
                type="button"
                disabled={isDeleting}
                onClick={onDelete}
                style={{ minHeight: '38px', padding: '0 12px', fontSize: '13px' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            {!canModify && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Locked</span>
            )}
          </div>
        ) : (
          authenticated ? (
            !isOwner && (
              <div className="event-card__rsvp-action">
                {rsvp.going ? (
                  <button className="secondary-button" type="button" disabled={rsvp.isBusy} onClick={handleNotGoing}>
                    {rsvp.isBusy ? 'Updating…' : 'Going'}
                  </button>
                ) : (
                  <button className="primary-button" type="button" disabled={rsvp.isBusy} onClick={handleGoing}>
                    {rsvp.isBusy ? 'Updating…' : "I'm Going"}
                  </button>
                )}
              </div>
            )
          ) : (
            <Link className="secondary-link" to="/login">Login to RSVP</Link>
          )
        )}
      </div>

      {rsvp.status === 'error' && <p className="action-message action-message--error" role="alert">{rsvp.error}</p>}
      <Link className="event-card__link" to={`/events/${encodeURIComponent(event.eventId)}`}>View Event <span aria-hidden="true">→</span></Link>
    </article>
  )
}
