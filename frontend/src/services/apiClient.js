const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
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
    const error = new Error(payload?.error || `API request failed with status ${response.status}`)
    error.status = response.status
    error.conflicts = payload?.conflicts || []
    throw error
  }

  return payload
}

export { API_BASE_URL }
