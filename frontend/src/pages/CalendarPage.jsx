import calendarHero from '../assets/calendar-hero.jpeg'
import Calendar from '../components/calendar/Calendar.jsx'
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
      <header className="calendar-page__intro page-hero-layout">
        <div className="page-hero-layout__copy">
          <p className="eyebrow">Community events</p>
          <h1>Calendar</h1>
          <p className="calendar-page__description">
            Browse upcoming local events by date. Select an event to open its existing details page.
          </p>
        </div>
        <div className="page-hero-layout__image">
          <img src={calendarHero} alt="" />
        </div>
      </header>

      <div className="location-status" style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        {locationStatus === 'detecting' && <span>Detecting your location...</span>}
        {locationStatus === 'resolved' && district && <span>Showing events near <strong>{district}</strong></span>}
        {locationStatus === 'denied' && <span>Location access denied. Showing all upcoming events.</span>}
        {(locationStatus === 'error' || (locationStatus === 'resolved' && !district)) && <span>Unable to determine your district. Showing all events.</span>}
        {(locationStatus === 'denied' || locationStatus === 'error') && (
          <button onClick={detectLocation} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 700, padding: 0, textDecoration: 'underline' }}>
            Retry Detection
          </button>
        )}
      </div>

      <Calendar {...calendar} />
    </main>
  )
}
