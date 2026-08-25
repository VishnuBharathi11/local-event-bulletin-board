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
    throw new Error('Unable to connect to the event service. Check your network connection and try again.')
  }

  let payload = null
  try { payload = await response.json() } catch { /* empty response */ }

  if (!response.ok) {
    const error = new Error(payload?.error || 'The event service returned an unexpected error.')
    error.status = response.status
    error.conflicts = payload?.conflicts || []
    throw error
  }

  return payload
}

export function getEvents() {
  return request('/events')
}

export function getEventById(eventId) {
  return request(`/events/${encodeURIComponent(eventId)}`)
}

export function createEvent(event) {
  return request('/events', { method: 'POST', body: JSON.stringify(event) })
}

export function checkEventConflicts(event) {
  return request('/events/conflicts/check', { method: 'POST', body: JSON.stringify(event) })
}

export function continueEventCreation(event) {
  return request('/events/conflicts/continue', { method: 'POST', body: JSON.stringify(event) })
}
