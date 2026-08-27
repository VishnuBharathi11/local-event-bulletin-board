import calendarHero from '../assets/calendar-hero.jpeg'
import Calendar from '../components/calendar/Calendar.jsx'
import { useCalendar } from '../hooks/useCalendar.js'
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
      <header className="calendar-page__intro">
        <p className="eyebrow">Community events</p>
        <h1>Calendar</h1>
        <p className="calendar-page__description">
          Browse upcoming local events by date. Select an event to open its existing details page.
        </p>
      </header>
      <Calendar {...calendar} />
    </main>
  )
}
