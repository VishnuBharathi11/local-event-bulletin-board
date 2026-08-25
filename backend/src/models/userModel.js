const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email) {
  return String(email ?? '').trim().toLocaleLowerCase()
}

function normalizeUser(input = {}, userId = input.userId || '') {
  const user = {
    userId: String(userId || ''),
    name: input.name ?? '',
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash ?? '',
    createdAt: input.createdAt ?? 0,
  }

  if (typeof user.name !== 'string') throw new TypeError('name must be a string')
  if (typeof user.email !== 'string') throw new TypeError('email must be a string')
  if (typeof user.passwordHash !== 'string') throw new TypeError('passwordHash must be a string')
  if (!Number.isSafeInteger(user.createdAt)) throw new TypeError('createdAt must be a safe integer')
  return user
}

function validateRegistration(input = {}) {
  const name = String(input.name ?? '').trim()
  const email = normalizeEmail(input.email)
  const password = String(input.password ?? '')

  if (!name) throw Object.assign(new Error('Name is required.'), { statusCode: 400 })
  if (!email) throw Object.assign(new Error('Email is required.'), { statusCode: 400 })
  if (!EMAIL_PATTERN.test(email)) throw Object.assign(new Error('Invalid email address.'), { statusCode: 400 })
  if (!password) throw Object.assign(new Error('Password is required.'), { statusCode: 400 })
  if (password.length < 8) throw Object.assign(new Error('Password must be at least 8 characters.'), { statusCode: 400 })

  return { name, email, password }
}

function validateLogin(input = {}) {
  const email = normalizeEmail(input.email)
  const password = String(input.password ?? '')
  if (!email || !password) throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 })
  if (!EMAIL_PATTERN.test(email)) throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 })
  return { email, password }
}

function toPublicUser(user) {
  if (!user) return null
  return { userId: user.userId, name: user.name, email: user.email }
}

function toFirestoreUser(user) {
  const normalized = normalizeUser(user)
  const { userId: _userId, ...fields } = normalized
  return fields
}

function fromFirestoreDocument(snapshot) {
  if (!snapshot.exists) return null
  return normalizeUser(snapshot.data(), snapshot.id)
}

module.exports = {
  EMAIL_PATTERN,
  normalizeEmail,
  normalizeUser,
  validateRegistration,
  validateLogin,
  toPublicUser,
  toFirestoreUser,
  fromFirestoreDocument,
}
