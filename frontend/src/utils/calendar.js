const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export { WEEKDAYS }

export function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export function startOfMonth(date = new Date()) {
  const value = new Date(date)
  value.setDate(1)
  value.setHours(0, 0, 0, 0)
  return value
}

export function isSameDay(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
}

export function isSameMonth(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
}

export function addMonths(date, amount) {
  const value = new Date(date)
  value.setDate(1)
  value.setMonth(value.getMonth() + amount)
  value.setHours(0, 0, 0, 0)
  return value
}

export function getCalendarCells(displayedMonth) {
  const monthStart = startOfMonth(displayedMonth)
  const firstDayMondayIndex = (monthStart.getDay() + 6) % 7
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate()

  const cells = []
  const totalCells = 42

  for (let index = 0; index < totalCells; index += 1) {
    const date = new Date(monthStart)
    date.setDate(index - firstDayMondayIndex + 1)
    date.setHours(0, 0, 0, 0)
    cells.push({
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: isSameDay(date, startOfToday()),
    })
  }

  return { cells, daysInMonth }
}

export function isExpired(event, now = Date.now()) {
  return Number.isFinite(Number(event.expireAt)) && now >= Number(event.expireAt)
}

export function getCalendarEvents(events, now = Date.now()) {
  return events.filter((event) => !isExpired(event, now))
}

export function getEventsForDate(events, selectedDate) {
  return events
    .filter((event) => {
      const start = new Date(Number(event.startTime))
      return Number.isFinite(start.getTime()) && isSameDay(start, selectedDate)
    })
    .sort((first, second) => Number(first.startTime) - Number(second.startTime))
}

export function getEventDaysForMonth(events, displayedMonth) {
  return new Set(
    events
      .filter((event) => {
        const start = new Date(Number(event.startTime))
        return Number.isFinite(start.getTime()) && isSameMonth(start, displayedMonth)
      })
      .map((event) => new Date(Number(event.startTime)).getDate()),
  )
}

export function formatMonthYear(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatSelectedDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
