import { apiRequest } from './apiClient.js'

export function getRSVPStatus(eventId) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}/rsvp`)
}

export function rsvpToEvent(eventId) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'POST' })
}

export function removeRSVP(eventId) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'DELETE' })
}
