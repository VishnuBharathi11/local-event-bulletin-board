import calendarHero from '../assets/calendar-hero.jpeg'
import Calendar from '../components/calendar/Calendar.jsx'
import LocationFilters from '../components/discovery/LocationFilters.jsx'
import { useCalendar } from '../hooks/useCalendar.js'
import { useLocation } from '../context/LocationContext.jsx'
import '../styles/calendar.css'

export default function CalendarPage() {
  const calendar = useCalendar()
  const { district, status: locationStatus, detectLocation } = useLocation()

  if (calendar.status === 'loading') {
    return (
      <div className="calendar-page calendar-page--state">
        <div className="state-card state-card--loading" role="status">
          <span className="state-card__icon" aria-hidden="true">◷</span>
          <strong>Loading calendar…</strong>
          <span>Retrieving community events.</span>
        </div>
      </div>
    )
  }

  if (calendar.status === 'error') {
    return (
      <div className="calendar-page calendar-page--state">
        <div className="state-card state-card--error" role="alert">
          <span className="state-card__icon" aria-hidden="true">!</span>
          <strong>Unable to load calendar</strong>
          <span>Event data could not be retrieved. Please try again later.</span>
        </div>
      </div>
    )
  }

  return (
    <main className="calendar-page">
      <header className="calendar-page__intro page-hero-layout calendar-hero">
        <div className="page-hero-layout__copy">
          <p className="eyebrow">COMMUNITY EVENTS</p>
          <h1>Event Calendar</h1>
          <p className="calendar-page__description">
            Browse upcoming local events by date and discover what's happening in your community.
          </p>
        </div>
        <div className="page-hero-layout__image">
          <img src={calendarHero} alt="" />
        </div>
      </header>

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

      <div className="calendar-filters" style={{ marginBottom: '24px' }}>
        <LocationFilters
          city={calendar.selectedCity}
          cities={calendar.cityOptions}
          onCityChange={calendar.onCityChange}
        />
      </div>

      <Calendar {...calendar} />
    </main>
  )
}
