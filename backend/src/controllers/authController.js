const authService = require('../services/authService')
const { toPublicUser } = require('../models/userModel')

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function cookieOptions() {
  return [
    'HttpOnly',
    'Path=/',
    `Max-Age=${Math.floor(authService.SESSION_MAX_AGE_MS / 1000)}`,
    `SameSite=${process.env.AUTH_COOKIE_SAMESITE || (isProduction() ? 'None' : 'Lax')}`,
    ...(isProduction() ? ['Secure'] : []),
  ].join('; ')
}

function clearCookieOptions() {
  return ['HttpOnly', 'Path=/', 'Max-Age=0', 'SameSite=Lax', ...(isProduction() ? ['Secure'] : [])].join('; ')
}

function handleError(res, error) {
  if (error.statusCode) return res.status(error.statusCode).json({ error: error.message })
  if (error.code === 'DUPLICATE_EMAIL') return res.status(409).json({ error: 'An account with this email already exists.' })
  console.error('Authentication API error:', error)
  return res.status(500).json({ error: 'Authentication operation failed.' })
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${authService.SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions()}`)
}

async function register(req, res) {
  try {
    const result = await authService.register(req.body)
    setSessionCookie(res, result.token)
    return res.status(201).json({ user: result.user })
  } catch (error) {
    return handleError(res, error)
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body)
    setSessionCookie(res, result.token)
    return res.status(200).json({ user: result.user })
  } catch (error) {
    return handleError(res, error)
  }
}

async function logout(_req, res) {
  res.setHeader('Set-Cookie', `${authService.SESSION_COOKIE}=; ${clearCookieOptions()}`)
  return res.status(204).send()
}

async function me(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
  return res.status(200).json({ user: toPublicUser(req.user) })
}

async function updateProfile(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
  try {
    const user = await authService.updateProfile(req.user.userId, req.body)
    return res.status(200).json({ user })
  } catch (error) {
    return handleError(res, error)
  }
}

module.exports = { register, login, logout, me, updateProfile }
