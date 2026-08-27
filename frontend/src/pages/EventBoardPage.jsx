import eventCommunityHero from '../assets/event-community-hero.jpeg'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '../components/events/EventCard.jsx'
import DiscoveryControls from '../components/discovery/DiscoveryControls.jsx'
import EventMap from '../components/map/EventMap.jsx'
import { useEvents } from '../hooks/useEvents.js'
import { useEventDiscovery } from '../hooks/useEventDiscovery.js'
import { useLocation } from '../context/LocationContext.jsx'
import '../styles/eventMap.css'

export default function EventBoardPage() {
  const { status, events: rawEvents, error, reload } = useEvents()
  const discovery = useEventDiscovery(rawEvents)
  const { district, status: locationStatus, detectLocation } = useLocation()
  const [viewMode, setViewMode] = useState('list')

  const CATEGORY_INFOS = {
    All: {
      title: 'Discover local events',
      description: 'Explore and RSVP to activities happening in your community today.'
    },
    Sports: {
      title: 'Sports & Activities',
      description: 'Find sports, fitness sessions, and outdoor games happening near you.'
    },
    Music: {
      title: 'Concerts & Gigs',
      description: 'Discover local live music, performances, and student concerts.'
    },
    Food: {
      title: 'Food & Culinary',
      description: 'Explore food festivals, market stalls, and food pop-ups.'
    },
    Workshops: {
      title: 'Workshops & Seminars',
      description: 'Learn new skills at classes, tutoring sessions, and seminars.'
    },
    Meetups: {
      title: 'Socials & Meetups',
      description: 'Connect with people at neighborhood assemblies and volunteer projects.'
    },
    'Student Events': {
      title: 'Student Events',
      description: 'Check out study groups, campus meetups, and academic activities.'
    },
    'Garage Sale': {
      title: 'Garage & Flea Sales',
      description: 'Find local yard sales, flea markets, and second-hand sales.'
    },
    Community: {
      title: 'Community Programs',
      description: 'Participate in volunteer cleanups, local meetings, and civic workshops.'
    }
  };

  const categoryInfo = CATEGORY_INFOS[discovery.discovery.selectedCategory] || CATEGORY_INFOS.All;
  const categorySlug = discovery.discovery.selectedCategory.toLowerCase().replace(/\s+/g, '-');
  const isAll = discovery.discovery.selectedCategory === 'All';

  return (
    <section className="event-page">
      <header className={`event-board-header page-hero-layout event-board-header--${categorySlug}`}>
        <div className="page-hero-layout__copy">
          <span className="event-board-header__badge">EventHive · {discovery.discovery.selectedCategory}</span>
          <h1>{categoryInfo.title}</h1>
          <p className="event-board-header__sub">{categoryInfo.description}</p>
          <div className="event-board-header__actions" style={{ marginTop: '16px' }}>
            <Link className="primary-button event-board-header__btn" to="/events/new">Create Event</Link>
          </div>
        </div>
        {isAll && (
          <div className="page-hero-layout__image">
            <img src={eventCommunityHero} alt="" />
          </div>
        )}
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
          <div className="location-status" style={{ marginBottom: '16px', fontSize: '13.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            {locationStatus === 'detecting' && <span>Detecting location...</span>}
            {locationStatus === 'resolved' && district && <span>📍 Showing events in <strong>{district}</strong></span>}
            {locationStatus === 'denied' && <span>Location access denied. Showing all events.</span>}
            {(locationStatus === 'error' || (locationStatus === 'resolved' && !district)) && <span>Unable to determine district. Showing all events.</span>}
            {(locationStatus === 'denied' || locationStatus === 'error') && (
              <button onClick={detectLocation} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 700, padding: 0, textDecoration: 'underline' }}>
                Retry Detection
              </button>
            )}
          </div>

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
              <EventMap events={discovery.districtEvents} height="600px" />
              {discovery.districtEvents.some(e => !e.latitude) && (
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
