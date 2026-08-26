import { Link } from 'react-router-dom'
import CategoryBadge from './CategoryBadge.jsx'
import EventStatusBadge from './EventStatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useEventRSVP } from '../../hooks/useEventRSVP.js'
import { formatDate, formatEventTimeRange } from '../../utils/dateTime.js'

export default function EventCard({ event, onRsvpChanged }) {
  const { authenticated } = useAuth()
  const rsvp = useEventRSVP(event.eventId, authenticated)
  const rsvpLabel = event.rsvpCount === 1 ? '1 person going' : `${event.rsvpCount} people going`

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
      <div className="event-card__badges">
        <CategoryBadge category={event.category} />
        <EventStatusBadge status={event.status} />
      </div>
      <h2 className="event-card__title">{event.title}</h2>
      <p className="event-card__date">{formatDate(event.startTime)}</p>
      <p className="event-card__time">{formatEventTimeRange(event.startTime, event.endTime)}</p>
      <div className="event-card__location" title={`${event.location}, ${event.neighborhood}, ${event.city}`}>
        <span aria-hidden="true">⌖</span>
        <span>{event.location}, {event.neighborhood}, {event.city}</span>
      </div>
      <div className="event-card__footer">
        <span className="event-card__rsvp">{rsvpLabel}</span>
        {authenticated ? (
          <div>
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
        ) : (
          <Link className="secondary-link" to="/login">Login to RSVP</Link>
        )}
      </div>
      {rsvp.status === 'error' && <p className="action-message action-message--error" role="alert">{rsvp.error}</p>}
      <Link className="event-card__link" to={`/events/${encodeURIComponent(event.eventId)}`}>View Event</Link>
    </article>
  )
}
