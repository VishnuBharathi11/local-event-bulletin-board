const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const fullDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

function toDate(timestamp) {
  const value = Number(timestamp)
  if (!Number.isFinite(value)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(timestamp) {
  const date = toDate(timestamp)
  return date ? dateFormatter.format(date) : 'Invalid date'
}

export function formatTime(timestamp) {
  const date = toDate(timestamp)
  return date ? timeFormatter.format(date) : 'Invalid time'
}

export function formatFullDateTime(timestamp) {
  const date = toDate(timestamp)
  return date ? fullDateTimeFormatter.format(date) : 'Invalid date/time'
}

export function formatEventTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function toLocalDateInputValue(timestamp) {
  const date = toDate(timestamp)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toLocalTimeInputValue(timestamp) {
  const date = toDate(timestamp)
  if (!date) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
