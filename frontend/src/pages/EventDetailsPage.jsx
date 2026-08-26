import { Link, useParams } from 'react-router-dom'
import CategoryBadge from '../components/events/CategoryBadge.jsx'
import EventStatusBadge from '../components/events/EventStatusBadge.jsx'
import EventActions from '../components/events/EventActions.jsx'
import { useEvent } from '../hooks/useEvent.js'
import { useEventRSVP } from '../hooks/useEventRSVP.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'
import '../styles/eventDetails.css'

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const { status, event, error, reload } = useEvent(eventId)
  const { authenticated } = useAuth()
  const rsvp = useEventRSVP(eventId, authenticated)

  if (status === 'loading') {
    return (
      <div className="state-card state-card--loading" role="status">
        <div className="state-card__icon" aria-hidden="true">◷</div>
        <strong>Loading event…</strong>
        <span>Retrieving event details.</span>
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className="state-card state-card--error">
        <div className="state-card__icon" aria-hidden="true">!</div>
        <strong>Event not found</strong>
        <span>The requested event does not exist or is no longer available.</span>
        <Link className="secondary-link" to="/">Back to Event Board</Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="state-card state-card--error" role="alert">
        <div className="state-card__icon" aria-hidden="true">!</div>
        <strong>Unable to load event</strong>
        <span>{error}</span>
        <Link className="secondary-link" to="/">Back to Event Board</Link>
      </div>
    )
  }

  async function handleGoing() {
    const success = await rsvp.setGoing()
    if (success) await reload()
  }

  async function handleNotGoing() {
    const success = await rsvp.setNotGoing()
    if (success) await reload()
  }

  return (
    <article className="event-details">
      <Link className="back-link" to="/">← Back to Event Board</Link>

      {event.imageUrl && (
        <div className="event-details__hero-image-wrap">
          <img src={event.imageUrl} alt={event.title} className="event-details__hero-image" />
        </div>
      )}

      <div className={event.imageUrl ? 'event-details__layout event-details__layout--with-image' : 'event-details__layout'}>
        {!event.imageUrl && (
          <div className="event-details__visual" aria-label="Event visual placeholder">
            <div className="event-details__visual-mark" aria-hidden="true">EH</div>
            <span>Local event</span>
            <strong>{event.category}</strong>
          </div>
        )}

        <div className="event-details__main">
          <div className="event-details__badges">
            <CategoryBadge category={event.category} />
            <EventStatusBadge status={event.status} />
          </div>

          <h1>{event.title}</h1>

          <div className="event-details__facts" aria-label="Event information">
            <div className="event-detail-fact">
              <span className="event-detail-fact__icon" aria-hidden="true">◷</span>
              <div>
                <span className="event-detail-fact__label">Date & time</span>
                <strong>{formatDate(event.startTime)}</strong>
                <span>{formatEventTimeRange(event.startTime, event.endTime)}</span>
              </div>
            </div>
            <div className="event-detail-fact">
              <span className="event-detail-fact__icon" aria-hidden="true">⌖</span>
              <div>
                <span className="event-detail-fact__label">Location</span>
                <strong>{event.location}</strong>
                <span>{event.neighborhood}, {event.city}</span>
              </div>
            </div>
          </div>

          <div className="event-details__rsvp" aria-label="RSVP count">
            <div>
              <span className="event-details__rsvp-label">Attendance</span>
              <strong>{event.rsvpCount} {event.rsvpCount === 1 ? 'person is' : 'people are'} going</strong>
            </div>
            {rsvp.going && <span className="event-details__rsvp-state">You're on the list!</span>}
            {authenticated && currentUser?.userId === event.organizerId && <span className="event-details__rsvp-state" style={{ color: 'var(--brand)' }}>You are the organizer</span>}
          </div>

          {authenticated ? (
            currentUser?.userId !== event.organizerId ? (
              <>
                <EventActions
                  event={event}
                  going={rsvp.going}
                  isBusy={rsvp.isBusy || rsvp.status === 'loading'}
                  onGoing={handleGoing}
                  onNotGoing={handleNotGoing}
                />
                {rsvp.status === 'loading' && <p className="action-message" role="status">Checking your RSVP status…</p>}
                {rsvp.status === 'error' && <p className="action-message action-message--error" role="alert">{rsvp.error}</p>}
                {rsvp.action === 'idle' && rsvp.error && rsvp.status === 'ready' && <p className="action-message action-message--error" role="alert">{rsvp.error}</p>}
              </>
            ) : (
              <div className="event-details__actions">
                <p className="action-message">You are organizing this event. Manage it from your profile.</p>
              </div>
            )
          ) : (
            <div className="event-details__login-prompt">
              <div>
                <strong>Want to attend?</strong>
                <span>Sign in to RSVP to this event.</span>
              </div>
              <Link className="primary-button" to="/login">Login</Link>
            </div>
          )}
        </div>
      </div>

      <section className="event-details__description" aria-labelledby="event-description-heading">
        <p className="event-details__section-eyebrow">Event information</p>
        <h2 id="event-description-heading">About this event</h2>
        <p>{event.description}</p>
      </section>
    </article>
  )
}
