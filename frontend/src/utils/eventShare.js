import { formatDate, formatEventTimeRange } from './dateTime.js'

export function getPublicAppUrl() {
  return (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
}

export function getEventUrl(eventId) {
  return `${getPublicAppUrl()}/events/${encodeURIComponent(eventId)}`
}

export function buildEventShareContent(event) {
  const eventUrl = getEventUrl(event.eventId)
  const text = [
    `Check out this event: ${event.title}`,
    '',
    `Category: ${event.category}`,
    `Date: ${formatDate(event.startTime)}`,
    `Time: ${formatEventTimeRange(event.startTime, event.endTime)}`,
    `Location: ${event.location}, ${event.neighborhood}, ${event.city}`,
    '',
    'Open Event:',
    eventUrl,
  ].join('\n')

  return {
    title: event.title,
    text,
    url: eventUrl,
  }
}

export async function shareEvent(event) {
  const content = buildEventShareContent(event)

  if (typeof navigator.share === 'function') {
    await navigator.share(content)
    return { method: 'share', message: 'Event share sheet opened.' }
  }

  if (!navigator.clipboard?.writeText) {
    throw new Error('Sharing is unavailable because this browser does not support Web Share or clipboard access.')
  }

  await navigator.clipboard.writeText(content.text)
  return { method: 'clipboard', message: 'Event share text copied to the clipboard.' }
}
