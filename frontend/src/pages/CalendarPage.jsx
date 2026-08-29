import calendarImage from '../assets/calendar-hero.png'
import Calendar from '../components/calendar/Calendar.jsx'
import { useCalendar } from '../hooks/useCalendar.js'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import '../styles/calendar.css'

export default function CalendarPage() {
  const calendar = useCalendar()

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
      <header className="event-board-header event-board-header--all calendar-hero">
        <div className="event-board-header__bg" style={{ backgroundImage: `url(${calendarImage})` }} aria-hidden="true" />
        <div className="event-board-header__overlay" />
        <div className="event-board-header__content">
          <span className="event-board-header__badge">COMMUNITY EVENTS</span>
          <h1>Event Calendar</h1>
          <p className="event-board-header__sub">
            Browse upcoming local events by date and discover what's happening in your community.
          </p>
          <div className="event-board-header__actions" style={{ marginTop: '20px' }}>
            <Link className="primary-button event-board-header__btn" to="/events/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Create Event
            </Link>
          </div>
        </div>
      </header>

      <Calendar {...calendar} />
    </main>
  )
}
