import EventCard from '../events/EventCard.jsx'
import { getCalendarCells, formatMonthYear, formatSelectedDate, WEEKDAYS } from '../../utils/calendar.js'

export default function Calendar({
  currentMonth,
  selectedDate,
  eventDays,
  eventsForDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onDateSelected,
}) {
  const { cells } = getCalendarCells(currentMonth)

  return (
    <section className="calendar" aria-label="Community Calendar">
      <div className="calendar__header">
        <button
          className="calendar__nav-button"
          type="button"
          onClick={onPreviousMonth}
          aria-label="Previous Month"
        >
          <span aria-hidden="true">‹</span>
          <span className="calendar__nav-label">Previous</span>
        </button>

        <div className="calendar__month-heading">
          <h1>{formatMonthYear(currentMonth)}</h1>
          <button className="calendar__today-button" type="button" onClick={onToday}>
            Today
          </button>
        </div>

        <button
          className="calendar__nav-button"
          type="button"
          onClick={onNextMonth}
          aria-label="Next Month"
        >
          <span className="calendar__nav-label">Next</span>
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>

      <div className="calendar__grid" role="grid" aria-label={formatMonthYear(currentMonth)}>
        {cells.map((cell) => {
          const hasEvents = cell.isCurrentMonth && eventDays.has(cell.day)
          const selected = cell.date.getTime() === selectedDate.getTime()

          return (
            <button
              key={cell.date.toISOString()}
              className={[
                'calendar__day',
                cell.isCurrentMonth ? '' : 'calendar__day--outside',
                cell.isToday ? 'calendar__day--today' : '',
                selected ? 'calendar__day--selected' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              role="gridcell"
              aria-label={`${cell.date.toLocaleDateString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}${hasEvents ? ', has events' : ''}`}
              aria-pressed={selected}
              onClick={() => onDateSelected(cell.date)}
            >
              <span>{cell.day}</span>
              {hasEvents && <span className="calendar__event-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <section className="calendar__events" aria-labelledby="selected-date-heading">
        <div className="calendar__events-heading">
          <div>
            <p className="eyebrow">Selected date</p>
            <h2 id="selected-date-heading">{formatSelectedDate(selectedDate)}</h2>
          </div>
          <span className="calendar__event-count">
            {eventsForDate.length} {eventsForDate.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {eventsForDate.length === 0 ? (
          <div className="calendar__empty-state">
            <strong>No events on this date</strong>
            <span>Try another date to discover local events.</span>
          </div>
        ) : (
          <div className="event-grid">
            {eventsForDate.map((event) => <EventCard key={event.eventId} event={event} />)}
          </div>
        )}
      </section>
    </section>
  )
}
