import eventCommunityHero from '../assets/event-community-hero.jpeg'
import sportsHero from '../assets/category-sports.png'
import musicHero from '../assets/category-music.png'
import foodHero from '../assets/category-food.png'
import workshopsHero from '../assets/category-workshops.png'
import meetupsHero from '../assets/category-meetups.png'
import studentHero from '../assets/category-student-events.png'
import garageHero from '../assets/category-garage-sale.png'
import communityHero from '../assets/category-community.png'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Map, Plus } from 'lucide-react'
import EventCard from '../components/events/EventCard.jsx'
import DiscoveryControls from '../components/discovery/DiscoveryControls.jsx'
import EventMap from '../components/map/EventMap.jsx'
import { useEvents } from '../hooks/useEvents.js'
import { useEventDiscovery } from '../hooks/useEventDiscovery.js'
import { useLocation } from '../context/LocationContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/eventMap.css'

export default function EventBoardPage() {
  const { authenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const { status, events: rawEvents, error, reload, removeEvent } = useEvents()
  const discovery = useEventDiscovery(rawEvents)
  const { district, status: locationStatus, detectLocation } = useLocation()
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') === 'map' ? 'map' : 'list')

  useEffect(() => {
    const handleOpenMap = () => setViewMode('map')
    window.addEventListener('eventhive:open-map', handleOpenMap)
    return () => window.removeEventListener('eventhive:open-map', handleOpenMap)
  }, [])

  const CATEGORY_SLIDES = [
    { category: 'All', title: 'Discover local events', description: 'Explore and RSVP to activities happening in your community today.', image: eventCommunityHero },
    { category: 'Sports', title: 'Sports & Activities', description: 'Find sports, fitness sessions, and outdoor games happening near you.', image: sportsHero },
    { category: 'Music', title: 'Concerts & Gigs', description: 'Discover local live music, performances, and student concerts.', image: musicHero },
    { category: 'Food', title: 'Food & Culinary', description: 'Explore food festivals, market stalls, and food pop-ups.', image: foodHero },
    { category: 'Workshops', title: 'Workshops & Seminars', description: 'Learn new skills at classes, tutoring sessions, and seminars.', image: workshopsHero },
    { category: 'Meetups', title: 'Socials & Meetups', description: 'Connect with people at neighborhood meetings and volunteer projects.', image: meetupsHero },
    { category: 'Student Events', title: 'Student Events', description: 'Check out study groups, campus meetups, and academic activities.', image: studentHero },
    { category: 'Garage Sale', title: 'Garage & Flea Sales', description: 'Find local yard sales, flea markets, and second-hand sales.', image: garageHero },
    { category: 'Community', title: 'Community Programs', description: 'Participate in volunteer cleanups, local meetings, and civic workshops.', image: communityHero }
  ]

  const EXTENDED_SLIDES = useMemo(() => [...CATEGORY_SLIDES, CATEGORY_SLIDES[0]], [])
  const [slideIndex, setSlideIndex] = useState(0)
  const [withTransition, setWithTransition] = useState(true)

  useEffect(() => {
    if (discovery.discovery.selectedCategory !== 'All') return
    const timer = setInterval(() => {
      setWithTransition(true)
      setSlideIndex((prev) => prev + 1)
    }, 2000)
    return () => clearInterval(timer)
  }, [discovery.discovery.selectedCategory])

  const handleTransitionEnd = () => {
    if (slideIndex >= CATEGORY_SLIDES.length) {
      // Instantly jump to index 0 (which matches the cloned last slide) without backwards animation
      setWithTransition(false)
      setSlideIndex(0)
    }
  }

  // Verification Logging for Map View data flow
  if (viewMode === 'map' && status === 'success') {
    const mapVisibleEvents = rawEvents.filter(e => e.latitude && e.longitude);
    console.log("MAP VIEW TOTAL EVENTS RECEIVED =", rawEvents.length);
    console.log("MAP VIEW EVENTS WITH VALID COORDINATES =", mapVisibleEvents.length);
    if (mapVisibleEvents.length > 0) {
      console.log("MAP EVENT LOCATIONS =", mapVisibleEvents.map(e => ({ title: e.title, city: e.city, lat: e.latitude, lng: e.longitude })));
    }
  }

  const activeSlideIndex = discovery.discovery.selectedCategory === 'All'
    ? slideIndex
    : Math.max(0, CATEGORY_SLIDES.findIndex(s => s.category === discovery.discovery.selectedCategory))

  return (
    <section className={`event-page ${viewMode === 'list' ? 'event-page--list-padding' : ''}`}>
      {viewMode === 'list' && (
        <header className="event-board-header event-board-header--carousel">
          <div
            className="event-board-header__track"
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translateX(-${activeSlideIndex * 100}%)`,
              transition: withTransition ? 'transform 1.1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}
          >
            {EXTENDED_SLIDES.map((slide, idx) => {
              const slug = slide.category.toLowerCase().replace(/\s+/g, '-');
              return (
                <div
                  key={`${slide.category}-${idx}`}
                  className={`event-board-header__slide event-board-header--${slug}`}
                >
                  <div
                    className="event-board-header__bg"
                    style={{ backgroundImage: `url(${slide.image})` }}
                    aria-hidden="true"
                  />
                  <div className="event-board-header__overlay" />
                  <div className="event-board-header__content">
                    <span className="event-board-header__badge">EventHive · {slide.category}</span>
                    <h1>{slide.title}</h1>
                    <p className="event-board-header__sub">{slide.description}</p>
                    <div className="event-board-header__actions" style={{ marginTop: '20px' }}>
                      <Link
                        className="primary-button event-board-header__btn"
                        to="/events/new"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={16} /> Create Event
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </header>
      )}

      {status === 'loading' && <div className="state-card state-card--loading" role="status" aria-live="polite"><div className="state-card__icon" aria-hidden="true">◌</div><strong>Loading events…</strong><span>Retrieving events from the event service.</span></div>}
      {status === 'error' && <div className="state-card state-card--error" role="alert"><div className="state-card__icon" aria-hidden="true">!</div><strong>Unable to load events</strong><span>{error}</span><button className="secondary-button" type="button" onClick={reload}>Try Again</button></div>}

      {status === 'success' && (
        <>
          {viewMode === 'list' ? (
            <>
              {authenticated && (
                <div className="location-status" style={{ marginBottom: '16px', fontSize: '13.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  {locationStatus === 'detecting' && <span>Detecting location...</span>}
                  {locationStatus === 'resolved' && district && <span>Showing events in <strong>{district}</strong></span>}
                  {locationStatus === 'denied' && <span>Location access denied. Showing all events.</span>}
                  {(locationStatus === 'error' || (locationStatus === 'resolved' && !district)) && <span>Unable to determine district. Showing all events.</span>}
                  {(locationStatus === 'denied' || locationStatus === 'error') && <button onClick={detectLocation} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 700, padding: 0, textDecoration: 'underline' }}>Retry Detection</button>}
                </div>
              )}

              <DiscoveryControls
                discovery={discovery.discovery}
                cityOptions={discovery.cityOptions}
                actions={discovery}
                categoryCounts={discovery.categoryCounts}
              />

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
            <EventMap events={rawEvents} onBackToList={() => setViewMode('list')} />
          )}
        </>
      )}
    </section>
  )
}
