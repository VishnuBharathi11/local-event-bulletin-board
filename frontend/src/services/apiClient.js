const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'eventhive_auth_token'

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function removeAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore localStorage errors
  }
}

export async function apiRequest(path, options = {}) {
  let response
  const token = getAuthToken()
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders,
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to connect to the event service. Check your network connection and try again.')
  }

  const receivedToken = response.headers?.get ? response.headers.get('x-auth-token') : null
  if (receivedToken) {
    setAuthToken(receivedToken)
  }

  let payload = null
  try { payload = await response.json() } catch { /* empty response */ }

  if (!response.ok) {
    const error = new Error(payload?.error || `API request failed with status ${response.status}`)
    error.status = response.status
    error.conflicts = payload?.conflicts || []
    error.suggestions = payload?.suggestions || []
    throw error
  }

  if (payload?.token) {
    setAuthToken(payload.token)
  }

  return payload
}

export { API_BASE_URL }

