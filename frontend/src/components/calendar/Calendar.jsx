import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Bookmark,
  Clock,
  MapPin,
  ArrowRight
} from 'lucide-react'
import CategoryBadge from '../events/CategoryBadge.jsx'
import EventStatusBadge from '../events/EventStatusBadge.jsx'
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
      {/* Left Column: Monthly Calendar Datepicker */}
      <div className="calendar__datepicker">
        <div className="calendar__header">
          <button
            className="calendar__nav-button"
            type="button"
            onClick={onPreviousMonth}
            aria-label="Previous Month"
          >
            <ChevronLeft size={16} />
            <span className="calendar__nav-label">Previous</span>
          </button>

          <div className="calendar__month-heading">
            <h2>{formatMonthYear(currentMonth)}</h2>
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
            <ChevronRight size={16} />
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
      </div>

      {/* Right Column: Selected Date Panel */}
      <section className="calendar__events" aria-labelledby="selected-date-heading">
        {/* Selected Date Header (Fixed) */}
        <div className="calendar__events-heading">
          <div className="calendar__events-title-wrap">
            <div className="calendar__events-icon">
              <CalendarIcon size={20} />
            </div>
            <div>
              <p className="calendar__events-eyebrow">SELECTED DATE</p>
              <h2 id="selected-date-heading">{formatSelectedDate(selectedDate)}</h2>
            </div>
          </div>
          <span className="calendar__event-count">
            {eventsForDate.length} {eventsForDate.length === 1 ? 'EVENT' : 'EVENTS'}
          </span>
        </div>

        {/* Scrollable Events Container */}
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
                  <div className="calendar-event-preview-card__image-wrap">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt="" />
                    ) : (
                      <div className="calendar-event-preview-card__fallback-img">EH</div>
                    )}
                  </div>
                  <div className="calendar-event-preview-card__content">
                    <div className="calendar-event-preview-card__top-row">
                      <div className="calendar-event-preview-card__badges">
                        <CategoryBadge category={event.category} />
                        <EventStatusBadge status={event.status} />
                      </div>
                      <button
                        type="button"
                        className="calendar-event-preview-card__bookmark"
                        aria-label="Bookmark event"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Bookmark size={17} />
                      </button>
                    </div>
                    <h3 className="calendar-event-preview-card__title">{event.title}</h3>
                    <div className="calendar-event-preview-card__meta">
                      <span className="calendar-event-preview-card__meta-item">
                        <Clock size={13} />
                        {formatEventTimeRange(event.startTime, event.endTime)}
                      </span>
                      <span className="calendar-event-preview-card__meta-item">
                        <MapPin size={13} className="calendar-event-preview-card__pin-icon" />
                        {event.location}{[event.neighborhood, event.city].filter(Boolean).length > 0 ? `, ${[event.neighborhood, event.city].filter(Boolean).join(' · ')}` : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Footer Link */}
        <div className="calendar__events-footer">
          {(() => {
            const year = selectedDate.getFullYear()
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
            const day = String(selectedDate.getDate()).padStart(2, '0')
            const formattedDateParam = `${year}-${month}-${day}`
            return (
              <Link to={`/event-board?date=${formattedDateParam}`} className="calendar__view-all-link">
                View all events on this date <ArrowRight size={14} />
              </Link>
            )
          })()}
        </div>
      </section>
    </section>
  )
}
