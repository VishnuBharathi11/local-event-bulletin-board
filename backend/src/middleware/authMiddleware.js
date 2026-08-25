const { SESSION_COOKIE, verifySessionToken, getCurrentUser } = require('../services/authService')

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=')
    if (separator === -1) return cookies
    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (key) cookies[key] = decodeURIComponent(value)
    return cookies
  }, {})
}

async function resolveAuthenticatedUser(req) {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null

  try {
    const payload = verifySessionToken(token)
    return await getCurrentUser(payload.sub)
  } catch {
    return null
  }
}

async function authenticate(req, res, next) {
  try {
    const user = await resolveAuthenticatedUser(req)
    if (!user) return res.status(401).json({ error: 'Authentication required.' })
    req.user = user
    return next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return res.status(500).json({ error: 'Authentication service unavailable.' })
  }
}

async function attachUser(req, _res, next) {
  try {
    req.user = await resolveAuthenticatedUser(req)
  } catch {
    req.user = null
  }
  return next()
}

module.exports = { parseCookies, authenticate, attachUser }
