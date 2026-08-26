import { Link } from 'react-router-dom'
import EventCard from '../components/events/EventCard.jsx'
import DiscoveryControls from '../components/discovery/DiscoveryControls.jsx'
import { useEvents } from '../hooks/useEvents.js'
import { useEventDiscovery } from '../hooks/useEventDiscovery.js'

export default function EventBoardPage() {
  const { status, events: rawEvents, error, reload } = useEvents()
  const discovery = useEventDiscovery(rawEvents)

  return (
    <section className="event-page">
      <header className="event-page__header event-page__hero">
        <div className="event-page__hero-copy">
          <p className="eyebrow">EventHive · Local events</p>
          <h1>Discover what&apos;s happening nearby.</h1>
          <p className="event-page__description">Discover events happening in your local community.</p>
        </div>
        <div className="event-page__hero-action">
          <Link className="primary-button primary-button--header" to="/events/new">Create Event</Link>
        </div>
      </header>

      {status === 'loading' && (
        <div className="state-card state-card--loading" role="status" aria-live="polite">
          <div className="state-card__icon" aria-hidden="true">◌</div>
          <strong>Loading events…</strong>
          <span>Retrieving events from the event service.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="state-card state-card--error" role="alert">
          <div className="state-card__icon" aria-hidden="true">!</div>
          <strong>Unable to load events</strong>
          <span>{error}</span>
          <button className="secondary-button" type="button" onClick={reload}>Try Again</button>
        </div>
      )}

      {status === 'success' && (
        <>
          <DiscoveryControls
            discovery={discovery.discovery}
            cityOptions={discovery.cityOptions}
            neighborhoodOptions={discovery.neighborhoodOptions}
            actions={discovery}
          />

          {rawEvents.length === 0 ? (
            <div className="state-card state-card--empty">
              <div className="state-card__icon" aria-hidden="true">◎</div>
              <strong>No events available.</strong>
              <span>There are currently no events available.</span>
              <Link className="secondary-link" to="/events/new">Create the first event</Link>
            </div>
          ) : discovery.events.length === 0 ? (
            <div className="state-card state-card--empty">
              <div className="state-card__icon" aria-hidden="true">⌕</div>
              <strong>No matching events found.</strong>
              <span>Try changing your search or filters.</span>
              <button className="secondary-button" type="button" onClick={discovery.clearFilters}>Clear All</button>
            </div>
          ) : (
            <div className="event-grid" aria-live="polite">
              {discovery.events.map((event) => <EventCard key={event.eventId} event={event} onRsvpChanged={reload} />)}
            </div>
          )}
        </>
      )}
    </section>
  )
}
