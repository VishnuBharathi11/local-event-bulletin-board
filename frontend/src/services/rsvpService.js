import { getCurrentDevelopmentUserId } from '../state/currentUser.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to connect to the RSVP service. Check your network connection and try again.')
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // Empty responses are valid.
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'The RSVP service returned an unexpected error.')
  }

  return payload
}

export function getCurrentUserId() {
  return getCurrentDevelopmentUserId()
}

export function getRSVPStatus(eventId) {
  return request(`/events/${encodeURIComponent(eventId)}/rsvp`)
}

export function rsvpToEvent(eventId) {
  return request(`/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'POST' })
}

export function removeRSVP(eventId) {
  return request(`/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'DELETE' })
}
