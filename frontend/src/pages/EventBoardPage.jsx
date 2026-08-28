import eventCommunityHero from '../assets/event-community-hero.jpeg'
import sportsHero from '../assets/category-sports.png'
import musicHero from '../assets/category-music.png'
import foodHero from '../assets/category-food.png'
import workshopsHero from '../assets/category-workshops.png'
import meetupsHero from '../assets/category-meetups.png'
import studentHero from '../assets/category-student-events.png'
import garageHero from '../assets/category-garage-sale.png'
import communityHero from '../assets/category-community.png'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Map, Plus } from 'lucide-react'
import EventCard from '../components/events/EventCard.jsx'
import DiscoveryControls from '../components/discovery/DiscoveryControls.jsx'
import EventMap from '../components/map/EventMap.jsx'
import { useEvents } from '../hooks/useEvents.js'
import { useEventDiscovery } from '../hooks/useEventDiscovery.js'
import { useLocation } from '../context/LocationContext.jsx'
import '../styles/eventMap.css'

export default function EventBoardPage() {
  const { status, events: rawEvents, error, reload, removeEvent } = useEvents()
  const discovery = useEventDiscovery(rawEvents)
  const { district, status: locationStatus, detectLocation } = useLocation()
  const [viewMode, setViewMode] = useState('list')

  const CATEGORY_INFOS = {
    All: { title: 'Discover local events', description: 'Explore and RSVP to activities happening in your community today.', image: eventCommunityHero },
    Sports: { title: 'Sports & Activities', description: 'Find sports, fitness sessions, and outdoor games happening near you.', image: sportsHero },
    Music: { title: 'Concerts & Gigs', description: 'Discover local live music, performances, and student concerts.', image: musicHero },
    Food: { title: 'Food & Culinary', description: 'Explore food festivals, market stalls, and food pop-ups.', image: foodHero },
    Workshops: { title: 'Workshops & Seminars', description: 'Learn new skills at classes, tutoring sessions, and seminars.', image: workshopsHero },
    Meetups: { title: 'Socials & Meetups', description: 'Connect with people at neighborhood meetings and volunteer projects.', image: meetupsHero },
    'Student Events': { title: 'Student Events', description: 'Check out study groups, campus meetups, and academic activities.', image: studentHero },
    'Garage Sale': { title: 'Garage & Flea Sales', description: 'Find local yard sales, flea markets, and second-hand sales.', image: garageHero },
    Community: { title: 'Community Programs', description: 'Participate in volunteer cleanups, local meetings, and civic workshops.', image: communityHero }
  }

  const categoryInfo = CATEGORY_INFOS[discovery.discovery.selectedCategory] || CATEGORY_INFOS.All
  const categorySlug = discovery.discovery.selectedCategory.toLowerCase().replace(/\s+/g, '-')

  return (
    <section className={`event-page ${viewMode === 'list' ? 'event-page--list-padding' : ''}`}>
      {viewMode === 'list' && (
        <header className={`event-board-header event-board-header--${categorySlug}`}>
          {categoryInfo.image && <div className="event-board-header__bg" style={{ backgroundImage: `url(${categoryInfo.image})` }} aria-hidden="true" />}
          <div className="event-board-header__overlay" />
          <div className="event-board-header__content">
            <span className="event-board-header__badge">EventHive · {discovery.discovery.selectedCategory}</span>
            <h1>{categoryInfo.title}</h1>
            <p className="event-board-header__sub">{categoryInfo.description}</p>
            <div className="event-board-header__actions" style={{ marginTop: '20px' }}>
              <Link className="primary-button event-board-header__btn" to="/events/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Create Event
              </Link>
            </div>
          </div>
        </header>
      )}

      {status === 'loading' && <div className="state-card state-card--loading" role="status" aria-live="polite"><div className="state-card__icon" aria-hidden="true">◌</div><strong>Loading events…</strong><span>Retrieving events from the event service.</span></div>}
      {status === 'error' && <div className="state-card state-card--error" role="alert"><div className="state-card__icon" aria-hidden="true">!</div><strong>Unable to load events</strong><span>{error}</span><button className="secondary-button" type="button" onClick={reload}>Try Again</button></div>}

      {status === 'success' && (
        <>
          {viewMode === 'list' ? (
            <>
              <div className="location-status" style={{ marginBottom: '16px', fontSize: '13.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                {locationStatus === 'detecting' && <span>Detecting location...</span>}
                {locationStatus === 'resolved' && district && <span>Showing events in <strong>{district}</strong></span>}
                {locationStatus === 'denied' && <span>Location access denied. Showing all events.</span>}
                {(locationStatus === 'error' || (locationStatus === 'resolved' && !district)) && <span>Unable to determine district. Showing all events.</span>}
                {(locationStatus === 'denied' || locationStatus === 'error') && <button onClick={detectLocation} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 700, padding: 0, textDecoration: 'underline' }}>Retry Detection</button>}
              </div>

              <DiscoveryControls discovery={discovery.discovery} cityOptions={discovery.cityOptions} actions={discovery} />

              <div className="event-board__map-action-wrap">
                <button className="primary-button event-board__see-map-btn" type="button" onClick={() => setViewMode('map')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Map size={16} /> See Map
                </button>
              </div>

              {rawEvents.length === 0 ? (
                <div className="state-card state-card--empty"><div className="state-card__icon" aria-hidden="true">◎</div><strong>No upcoming events available.</strong><span>There are currently no events available.</span></div>
              ) : discovery.events.length === 0 ? (
                <div className="state-card state-card--empty"><div className="state-card__icon" aria-hidden="true">⌕</div><strong>No available upcoming events.</strong><span>Try changing your search or filters.</span><button className="secondary-button" type="button" onClick={discovery.clearFilters}>Clear All</button></div>
              ) : (
                <div className={`event-grid event-grid--${discovery.events.length === 1 ? '1' : discovery.events.length === 2 ? '2' : discovery.events.length === 3 ? '3' : 'many'}`} aria-live="polite">
                  {discovery.events.map((event) => <EventCard key={event.eventId} event={event} onExpired={removeEvent} />)}
                </div>
              )}
            </>
          ) : (
            <div className="event-map-page">
              <header className="event-map-page__header">
                <button className="secondary-button event-map-page__back-btn" type="button" onClick={() => setViewMode('list')}>← List View</button>
                <h1>Map View</h1>
              </header>
              <div className="event-map-view">
                <EventMap events={rawEvents} height="650px" />
                {rawEvents.some((event) => !event.latitude) && <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>* Some events don't have map locations yet and are not shown on the map.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
