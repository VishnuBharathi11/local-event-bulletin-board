import Calendar from '../components/calendar/Calendar.jsx'
import { useCalendar } from '../hooks/useCalendar.js'
import '../styles/calendar.css'

export default function CalendarPage() {
  const calendar = useCalendar()

  if (calendar.status === 'loading') {
    return (
      <div className="state-card" role="status">
        <strong>Loading calendar…</strong>
        <span>Retrieving community events.</span>
      </div>
    )
  }

  if (calendar.status === 'error') {
    return (
      <div className="state-card state-card--error" role="alert">
        <strong>Unable to load calendar</strong>
        <span>{calendar.error}</span>
      </div>
    )
  }

  return (
    <div className="calendar-page">
      <div className="calendar-page__intro">
        <p className="eyebrow">Community events</p>
        <p className="calendar-page__description">
          Browse upcoming local events by date. Select an event to open its existing details page.
        </p>
      </div>
      <Calendar {...calendar} />
    </div>
  )
}
