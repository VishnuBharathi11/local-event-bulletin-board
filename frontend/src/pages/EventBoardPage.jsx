import { Link } from 'react-router-dom'
import EventCard from '../components/events/EventCard.jsx'
import { useEvents } from '../hooks/useEvents.js'

export default function EventBoardPage() {
  const { status, events, error, reload } = useEvents()

  return (
    <section className="event-page">
      <header className="event-page__header">
        <div>
          <p className="eyebrow">Community events</p>
          <h1>Local Events</h1>
          <p className="event-page__description">Discover events happening in your local community.</p>
        </div>
        <Link className="primary-button primary-button--header" to="/events/new">Create Event</Link>
      </header>

      {status === 'loading' && <div className="state-card" role="status"><strong>Loading events…</strong><span>Retrieving events from the event service.</span></div>}

      {status === 'empty' && <div className="state-card"><strong>No events yet</strong><span>There are currently no events available.</span><Link className="secondary-link" to="/events/new">Create the first event</Link></div>}

      {status === 'error' && (
        <div className="state-card state-card--error" role="alert">
          <strong>Unable to load events</strong>
          <span>{error}</span>
          <button className="secondary-button" type="button" onClick={reload}>Try Again</button>
        </div>
      )}

      {status === 'success' && (
        <div className="event-grid" aria-live="polite">
          {events.map((event) => <EventCard key={event.eventId} event={event} />)}
        </div>
      )}
    </section>
  )
}
