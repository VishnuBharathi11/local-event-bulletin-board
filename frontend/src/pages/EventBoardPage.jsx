import eventCommunityHero from '../assets/event-community-hero.jpeg'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '../components/events/EventCard.jsx'
import DiscoveryControls from '../components/discovery/DiscoveryControls.jsx'
import EventMap from '../components/map/EventMap.jsx'
import { useEvents } from '../hooks/useEvents.js'
import { useEventDiscovery } from '../hooks/useEventDiscovery.js'
import '../styles/eventMap.css'

export default function EventBoardPage() {
  const { status, events: rawEvents, error, reload } = useEvents()
  const discovery = useEventDiscovery(rawEvents)
  const [viewMode, setViewMode] = useState('list')

  return (
    <section className="event-page">
      <header className="event-board-header">
        <div className="event-board-header__copy">
          <span className="event-board-header__badge">EventHive · Community Discovery</span>
          <h1>Discover local events</h1>
          <p className="event-board-header__sub">Explore and RSVP to activities happening in your community today.</p>
        </div>
        <div className="event-board-header__actions">
          <Link className="primary-button event-board-header__btn" to="/events/new">Create Event</Link>
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
            actions={discovery}
          />

          <div className="map-toggle-container">
            <button
              className={`map-toggle-button ${viewMode === 'list' ? 'map-toggle-button--active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button
              className={`map-toggle-button ${viewMode === 'map' ? 'map-toggle-button--active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              Map View
            </button>
          </div>

          {rawEvents.length === 0 ? (
            <div className="state-card state-card--empty">
              <div className="state-card__icon" aria-hidden="true">◎</div>
              <strong>No upcoming events available.</strong>
              <span>There are currently no events available.</span>
            </div>
          ) : discovery.events.length === 0 ? (
            <div className="state-card state-card--empty">
              <div className="state-card__icon" aria-hidden="true">⌕</div>
              <strong>No available upcoming events.</strong>
              <span>Try changing your search or filters.</span>
              <button className="secondary-button" type="button" onClick={discovery.clearFilters}>Clear All</button>
            </div>
          ) : viewMode === 'map' ? (
            <div className="event-map-view">
              <EventMap events={discovery.events} height="600px" />
              {discovery.events.some(e => !e.latitude) && (
                <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  * Some events don't have map locations yet and are not shown on the map.
                </p>
              )}
            </div>
          ) : (
            <div className={`event-grid event-grid--${discovery.events.length === 1 ? '1' : discovery.events.length === 2 ? '2' : discovery.events.length === 3 ? '3' : 'many'}`} aria-live="polite">
              {discovery.events.map((event) => <EventCard key={event.eventId} event={event} onRsvpChanged={reload} />)}
            </div>
          )}
        </>
      )}
    </section>
  )
}
