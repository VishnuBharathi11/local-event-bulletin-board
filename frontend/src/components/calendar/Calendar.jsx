import EventCard from '../events/EventCard.jsx'
import CategoryBadge from '../events/CategoryBadge.jsx'
import EventStatusBadge from '../events/EventStatusBadge.jsx'
import { Link } from 'react-router-dom'
import { formatEventTimeRange } from '../../utils/dateTime.js'
import { getCalendarCells, formatMonthYear, formatSelectedDate, WEEKDAYS, isExpired } from '../../utils/calendar.js'

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
  const now = Date.now()

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
            <p className="eyebrow">SELECTED DATE</p>
            <h2 id="selected-date-heading">{formatSelectedDate(selectedDate)}</h2>
          </div>
          <span className="calendar__event-count">
            {eventsForDate.length} {eventsForDate.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {eventsForDate.length === 0 ? (
          <div className="calendar__empty-state">
            <div className="calendar__empty-icon" aria-hidden="true">⌕</div>
            <strong>No events on this date</strong>
            <span>Try another date to discover local events.</span>
          </div>
        ) : (
          <div className="calendar__event-preview-list">
            {eventsForDate.map((event) => (
              <div
                key={event.eventId}
                className="calendar-event-preview-card"
                style={{ opacity: isExpired(event, now) ? 0.6 : 1 }}
              >
                <Link className="calendar-event-preview-card__link" to={`/events/${encodeURIComponent(event.eventId)}`}>
                  {event.imageUrl && (
                    <div className="calendar-event-preview-card__image-wrap">
                      <img src={event.imageUrl} alt="" />
                    </div>
                  )}
                  <div className="calendar-event-preview-card__content">
                    <div className="calendar-event-preview-card__badges">
                      <CategoryBadge category={event.category} />
                      <EventStatusBadge status={event.status} />
                    </div>
                    <h3 className="calendar-event-preview-card__title">{event.title}</h3>
                    <div className="calendar-event-preview-card__meta">
                      <span>🕐 {formatEventTimeRange(event.startTime, event.endTime)}</span>
                      <span>📍 {event.location}, {[event.neighborhood, event.city].filter(Boolean).join(' · ')}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
