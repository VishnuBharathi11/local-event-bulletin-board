import { Link } from 'react-router-dom'
import CategoryBadge from './CategoryBadge.jsx'
import EventStatusBadge from './EventStatusBadge.jsx'
import { formatDate, formatEventTimeRange } from '../../utils/dateTime.js'

export default function EventCard({ event }) {
  const rsvpLabel = event.rsvpCount === 1 ? '1 person going' : `${event.rsvpCount} people going`

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
        <Link className="event-card__link" to={`/events/${encodeURIComponent(event.eventId)}`}>View Event</Link>
      </div>
    </article>
  )
}
