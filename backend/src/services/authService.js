const crypto = require('node:crypto')
const userRepository = require('../repositories/userRepository')
const { getFirebaseAuth } = require('../config/firebaseAdmin')
const { validateRegistration, validateLogin, toPublicUser } = require('../models/userModel')

const SESSION_COOKIE = 'eventhive_session'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const PASSWORD_SCRYPT = Object.freeze({ N: 16384, r: 8, p: 1, keyLength: 64 })

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret || secret.length < 32) {
    const error = new Error('Authentication is not configured securely.')
    error.statusCode = 500
    throw error
  }
  return secret
}

function base64UrlEncode(value) { return Buffer.from(value).toString('base64url') }
function base64UrlDecode(value) { return Buffer.from(value, 'base64url').toString('utf8') }

function signJwt(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const unsigned = `${header}.${body}`
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}

function verifyJwt(token) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) throw new Error('Invalid session token')
  const [header, body, signature] = parts
  let parsedHeader
  let payload
  try {
    parsedHeader = JSON.parse(base64UrlDecode(header))
    payload = JSON.parse(base64UrlDecode(body))
  } catch {
    throw new Error('Invalid session token')
  }
  if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') throw new Error('Invalid session token')
  const expected = crypto.createHmac('sha256', getJwtSecret()).update(`${header}.${body}`).digest('base64url')
  const receivedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) throw new Error('Invalid session token')
  if (payload.iss !== 'eventhive-api' || payload.aud !== 'eventhive-web') throw new Error('Invalid session token')
  if (!Number.isSafeInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Session expired')
  if (!payload.sub) throw new Error('Invalid session token')
  return payload
}

function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000)
  return signJwt({ sub: user.userId, jti: crypto.randomUUID(), iat: now, exp: now + 7 * 24 * 60 * 60, iss: 'eventhive-api', aud: 'eventhive-web' })
}

function derivePassword(password, salt, options = PASSWORD_SCRYPT) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, options.keyLength, { N: options.N, r: options.r, p: options.p, maxmem: 64 * 1024 * 1024 }, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey)
    })
  })
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url')
  const derivedKey = await derivePassword(password, salt)
  return `scrypt$${PASSWORD_SCRYPT.N}$${PASSWORD_SCRYPT.r}$${PASSWORD_SCRYPT.p}$${salt}$${derivedKey.toString('base64url')}`
}

async function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, salt, encodedHash] = parts
  const options = { N: Number(n), r: Number(r), p: Number(p), keyLength: PASSWORD_SCRYPT.keyLength }
  if (!Number.isInteger(options.N) || !Number.isInteger(options.r) || !Number.isInteger(options.p) || !salt || !encodedHash) return false
  try {
    const derivedKey = await derivePassword(password, salt, options)
    const expected = Buffer.from(encodedHash, 'base64url')
    return expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey)
  } catch {
    return false
  }
}

async function register(input) {
  const { name, email, password } = validateRegistration(input)
  const passwordHash = await hashPassword(password)
  try {
    const user = await userRepository.createUser({ name, email, passwordHash, createdAt: Date.now() })
    return { user: toPublicUser(user), token: createSessionToken(user) }
  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL') {
      const duplicate = new Error('An account with this email already exists.')
      duplicate.statusCode = 409
      throw duplicate
    }
    throw error
  }
}

async function login(input) {
  const { email, password } = validateLogin(input)
  const user = await userRepository.getUserByEmail(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const error = new Error('Invalid email or password.')
    error.statusCode = 401
    throw error
  }
  return { user: toPublicUser(user), token: createSessionToken(user) }
}

async function loginWithGoogle(idToken) {
  if (!idToken) {
    const error = new Error('Google authentication token is required.')
    error.statusCode = 400
    throw error
  }

  let decodedToken
  try {
    decodedToken = await getFirebaseAuth().verifyIdToken(idToken)
  } catch {
    const error = new Error('Google authentication could not be verified.')
    error.statusCode = 401
    throw error
  }

  if (decodedToken.firebase?.sign_in_provider !== 'google.com') {
    const error = new Error('A Google authentication token is required.')
    error.statusCode = 401
    throw error
  }

  const email = String(decodedToken.email || '').trim().toLowerCase()
  if (!email || decodedToken.email_verified !== true) {
    const error = new Error('Google account email verification is required.')
    error.statusCode = 403
    throw error
  }

  let user = await userRepository.getUserByEmail(email)
  if (!user) {
    const name = String(decodedToken.name || email.split('@')[0]).trim() || 'EventHive User'
    try {
      user = await userRepository.createUser({ name, email, passwordHash: '', createdAt: Date.now() })
    } catch (error) {
      if (error.code !== 'DUPLICATE_EMAIL') throw error
      user = await userRepository.getUserByEmail(email)
    }
  }

  if (!user) {
    const error = new Error('Unable to create or load the EventHive account.')
    error.statusCode = 500
    throw error
  }

  return { user: toPublicUser(user), token: createSessionToken(user) }
}

async function getCurrentUser(userId) {
  if (!userId) return null
  const user = await userRepository.getUserById(userId)
  return toPublicUser(user)
}

async function updateProfile(userId, input) {
  const { validateProfileUpdate } = require('../models/userModel')
  const updates = validateProfileUpdate(input)
  const user = await userRepository.updateUser(userId, updates)
  return toPublicUser(user)
}

module.exports = {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  PASSWORD_SCRYPT,
  createSessionToken,
  verifySessionToken: verifyJwt,
  hashPassword,
  verifyPassword,
  register,
  login,
  loginWithGoogle,
  getCurrentUser,
  updateProfile,
}
