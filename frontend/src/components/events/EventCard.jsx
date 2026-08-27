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
        <div className="event-card__image-wrap event-card__image-wrap--fallback">
          <div className="event-card__fallback-text">EH</div>
        </div>
      )}
      <div className="event-card__badges">
        <CategoryBadge category={event.category} />
        <EventStatusBadge status={event.status} />
      </div>

      <h2 className="event-card__title">{event.title}</h2>
      <div className="event-card__info-block">
        <p className="event-card__info-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>{formatDate(event.startTime)}</span>
        </p>
        <p className="event-card__info-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>{formatEventTimeRange(event.startTime, event.endTime)}</span>
        </p>
      </div>

      <div className="event-card__location" title={locationLabel}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--brand)', marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
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
