import { apiRequest } from './apiClient.js'

export function getEvents() {
  return apiRequest('/events')
}

export function getEventById(eventId) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}`)
}

export function createEvent(event) {
  return apiRequest('/events', { method: 'POST', body: JSON.stringify(event) })
}

export function checkEventConflicts(event) {
  return apiRequest('/events/conflicts/check', { method: 'POST', body: JSON.stringify(event) })
}

export function continueEventCreation(event) {
  return apiRequest('/events/conflicts/continue', { method: 'POST', body: JSON.stringify(event) })
}
