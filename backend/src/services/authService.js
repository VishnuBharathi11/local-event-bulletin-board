const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('node:crypto')
const userRepository = require('../repositories/userRepository')
const { validateRegistration, validateLogin, toPublicUser } = require('../models/userModel')

const SESSION_COOKIE = 'eventhive_session'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret || secret.length < 32) {
    const error = new Error('Authentication is not configured securely.')
    error.statusCode = 500
    throw error
  }
  return secret
}

function createSessionToken(user) {
  return jwt.sign({ sub: user.userId, jti: crypto.randomUUID() }, getJwtSecret(), {
    expiresIn: '7d',
    issuer: 'eventhive-api',
    audience: 'eventhive-web',
  })
}

function verifySessionToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: 'eventhive-api',
    audience: 'eventhive-web',
  })
}

async function register(input) {
  const { name, email, password } = validateRegistration(input)
  const passwordHash = await bcrypt.hash(password, 12)
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
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error('Invalid email or password.')
    error.statusCode = 401
    throw error
  }
  return { user: toPublicUser(user), token: createSessionToken(user) }
}

async function getCurrentUser(userId) {
  if (!userId) return null
  const user = await userRepository.getUserById(userId)
  return toPublicUser(user)
}

module.exports = {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  createSessionToken,
  verifySessionToken,
  register,
  login,
  getCurrentUser,
}
