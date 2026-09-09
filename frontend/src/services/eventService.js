import { apiRequest } from './apiClient.js'

export function getEvents() {
  return apiRequest('/events')
}

export function getMyEvents() {
  return apiRequest('/events/mine')
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

export function saveEvent(event) {
  return apiRequest(`/events/${encodeURIComponent(event.eventId)}`, { method: 'PATCH', body: JSON.stringify(event) })
}

export function deleteEvent(eventId) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' })
}

export function continueEventCreation(event) {
  return apiRequest('/events/conflicts/continue', { method: 'POST', body: JSON.stringify(event) })
}

export function generateEventDescription(event) {
  return apiRequest('/ai/event-description', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}
