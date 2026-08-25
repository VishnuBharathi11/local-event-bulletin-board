import { Link, useParams } from 'react-router-dom'
import CategoryBadge from '../components/events/CategoryBadge.jsx'
import EventStatusBadge from '../components/events/EventStatusBadge.jsx'
import { useEvent } from '../hooks/useEvent.js'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const { status, event, error } = useEvent(eventId)

  if (status === 'loading') {
    return <div className="state-card" role="status"><strong>Loading event…</strong><span>Retrieving event details.</span></div>
  }

  if (status === 'not-found') {
    return (
      <div className="state-card state-card--error">
        <strong>Event not found</strong>
        <span>The requested event does not exist or is no longer available.</span>
        <Link className="secondary-link" to="/">Back to Event Board</Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="state-card state-card--error" role="alert">
        <strong>Unable to load event</strong>
        <span>{error}</span>
        <Link className="secondary-link" to="/">Back to Event Board</Link>
      </div>
    )
  }

  return (
    <article className="event-details">
      <Link className="back-link" to="/">← Back to Event Board</Link>

      <div className="event-details__badges">
        <CategoryBadge category={event.category} />
        <EventStatusBadge status={event.status} />
      </div>

      <h1>{event.title}</h1>

      <div className="event-details__facts">
        <div className="event-detail-fact">
          <span className="event-detail-fact__icon" aria-hidden="true">◷</span>
          <div>
            <strong>{formatDate(event.startTime)}</strong>
            <span>{formatEventTimeRange(event.startTime, event.endTime)}</span>
          </div>
        </div>
        <div className="event-detail-fact">
          <span className="event-detail-fact__icon" aria-hidden="true">⌖</span>
          <div>
            <strong>{event.location}</strong>
            <span>{event.neighborhood}, {event.city}</span>
          </div>
        </div>
      </div>

      <section className="event-details__description">
        <h2>About this event</h2>
        <p>{event.description}</p>
      </section>

      <div className="event-details__rsvp" aria-label="RSVP count">
        <strong>{event.rsvpCount} {event.rsvpCount === 1 ? 'person is' : 'people are'} going!</strong>
        <span>RSVP information is read-only in this phase.</span>
      </div>
    </article>
  )
}
