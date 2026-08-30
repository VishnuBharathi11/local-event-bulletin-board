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
    try {
      await navigator.share({
        title: content.title,
        text: content.title,
        url: content.url,
      })
      return { method: 'share', message: 'Event share sheet opened.' }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { method: 'cancelled', message: '' }
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content.url)
    return { method: 'clipboard', message: 'Event link copied!' }
  }

  throw new Error('Sharing is unavailable because this browser does not support Web Share or clipboard access.')
}

export function getRequestUrl(requestId) {
  return `${getPublicAppUrl()}/community-requests/${encodeURIComponent(requestId)}`
}

export function buildRequestShareContent(request) {
  const requestUrl = getRequestUrl(request.requestId)
  const text = [
    `Check out this community request: ${request.title}`,
    '',
    `Category: ${request.category}`,
    `Date: ${formatDate(request.startTime)}`,
    `Time: ${formatEventTimeRange(request.startTime, request.endTime)}`,
    `Location: ${request.location || 'Local Community'}`,
    '',
    'Open Request:',
    requestUrl,
  ].join('\n')

  return {
    title: request.title,
    text,
    url: requestUrl,
  }
}

export async function shareRequest(request) {
  const content = buildRequestShareContent(request)

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: content.title,
        text: content.title,
        url: content.url,
      })
      return { method: 'share', message: 'Request share sheet opened.' }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { method: 'cancelled', message: '' }
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content.url)
    return { method: 'clipboard', message: 'Request link copied!' }
  }

  throw new Error('Sharing is unavailable because this browser does not support Web Share or clipboard access.')
}
