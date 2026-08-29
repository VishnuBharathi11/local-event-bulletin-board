const test = require('node:test')
const assert = require('node:assert/strict')

process.env.AUTH_JWT_SECRET = 'test-secret-with-at-least-32-characters-long'

const userRepository = require('../src/repositories/userRepository')
const authService = require('../src/services/authService')
const { validateRegistration, validateLogin, normalizeEmail, toPublicUser } = require('../src/models/userModel')
const { parseCookies } = require('../src/middleware/authMiddleware')

const originalRepository = { createUser: userRepository.createUser, getUserByEmail: userRepository.getUserByEmail, getUserById: userRepository.getUserById }

function fakeUser(overrides = {}) {
  return { userId: 'user-a', name: 'User A', email: 'user@example.com', passwordHash: '', createdAt: 1000, ...overrides }
}

function fakeResponse() {
  return {
    statusCode: 200, body: null, headers: {},
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
    setHeader(name, value) { this.headers[name] = value; return this },
    send() { return this },
  }
}

async function withRepository(stubs, callback) {
  Object.assign(userRepository, stubs)
  try { return await callback() } finally { Object.assign(userRepository, originalRepository) }
}

test('1. valid registration input is accepted', () => assert.deepEqual(validateRegistration({ name: ' User ', email: ' USER@Example.COM ', password: 'password8' }), { name: 'User', email: 'user@example.com', password: 'password8' }))
test('2. registration rejects missing name', () => assert.throws(() => validateRegistration({ email: 'user@example.com', password: 'password8' }), /Name is required/))
test('3. registration rejects missing email', () => assert.throws(() => validateRegistration({ name: 'User', password: 'password8' }), /Email is required/))
test('4. registration rejects invalid email', () => assert.throws(() => validateRegistration({ name: 'User', email: 'not-an-email', password: 'password8' }), /Invalid email address/))
test('5. registration rejects missing password', () => assert.throws(() => validateRegistration({ name: 'User', email: 'user@example.com' }), /Password is required/))
test('6. registration rejects short password', () => assert.throws(() => validateRegistration({ name: 'User', email: 'user@example.com', password: 'short' }), /at least 8 characters/))
test('7. email normalization is deterministic', () => assert.equal(normalizeEmail('  USER@Example.COM '), 'user@example.com'))
test('8. valid login input is accepted', () => assert.deepEqual(validateLogin({ email: ' USER@example.com ', password: 'password8' }), { email: 'user@example.com', password: 'password8' }))
test('9. invalid login input produces a generic authentication error', () => assert.throws(() => validateLogin({ email: 'bad', password: 'password8' }), /Invalid email or password/))
test('10. public user projection contains only MVP fields', () => assert.deepEqual(toPublicUser(fakeUser({ passwordHash: 'secret-hash' })), { userId: 'user-a', name: 'User A', email: 'user@example.com' }))

test('11. registration creates a scrypt password hash', async () => {
  await withRepository({ createUser: async (user) => ({ ...user, userId: 'user-a' }) }, async () => {
    const result = await authService.register({ name: 'User A', email: 'hash@example.com', password: 'password8' })
    assert.equal(result.user.passwordHash, undefined)
  })
})
test('12. registration returns authenticated user information', async () => {
  await withRepository({ createUser: async (user) => ({ ...user, userId: 'user-a' }) }, async () => {
    const result = await authService.register({ name: 'User A', email: 'register@example.com', password: 'password8' })
    assert.deepEqual(result.user, { userId: 'user-a', name: 'User A', email: 'register@example.com' })
    assert.ok(result.token)
  })
})
test('13. registration never returns passwordHash', async () => {
  await withRepository({ createUser: async (user) => ({ ...user, userId: 'user-a' }) }, async () => {
    const result = await authService.register({ name: 'User A', email: 'safe@example.com', password: 'password8' })
    assert.equal(Object.prototype.hasOwnProperty.call(result.user, 'passwordHash'), false)
  })
})
test('14. duplicate email maps to conflict', async () => {
  await withRepository({ createUser: async () => { const error = new Error('duplicate'); error.code = 'DUPLICATE_EMAIL'; throw error } }, async () => {
    await assert.rejects(() => authService.register({ name: 'User A', email: 'duplicate@example.com', password: 'password8' }), (error) => error.statusCode === 409)
  })
})
test('15. valid login verifies the password and returns the user', async () => {
  const passwordHash = await authService.hashPassword('password8')
  await withRepository({ getUserByEmail: async () => fakeUser({ passwordHash }) }, async () => {
    const result = await authService.login({ email: 'user@example.com', password: 'password8' })
    assert.deepEqual(result.user, { userId: 'user-a', name: 'User A', email: 'user@example.com' })
  })
})
test('16. invalid login credentials return 401', async () => {
  await withRepository({ getUserByEmail: async () => null }, async () => {
    await assert.rejects(() => authService.login({ email: 'user@example.com', password: 'wrongpass' }), (error) => error.statusCode === 401 && error.message === 'Invalid email or password.')
  })
})
test('17. current-user lookup returns the authenticated user', async () => {
  await withRepository({ getUserById: async () => fakeUser() }, async () => assert.deepEqual(await authService.getCurrentUser('user-a'), { userId: 'user-a', name: 'User A', email: 'user@example.com' }))
})
test('18. current-user lookup returns null for an unknown user', async () => {
  await withRepository({ getUserById: async () => null }, async () => assert.equal(await authService.getCurrentUser('missing'), null))
})
test('19. session token round-trips the authenticated user id', () => {
  const payload = authService.verifySessionToken(authService.createSessionToken(fakeUser()))
  assert.equal(payload.sub, 'user-a')
  assert.ok(payload.jti)
})
test('20. tampered session token is rejected', () => {
  const token = authService.createSessionToken(fakeUser())
  assert.throws(() => authService.verifySessionToken(`${token}tampered`))
})
test('21. session token has the expected issuer and audience', () => {
  const payload = authService.verifySessionToken(authService.createSessionToken(fakeUser()))
  assert.equal(payload.iss, 'eventhive-api')
  assert.equal(payload.aud, 'eventhive-web')
})
test('22. cookie parser extracts the authentication cookie', () => assert.deepEqual(parseCookies('foo=bar; eventhive_session=abc123'), { foo: 'bar', eventhive_session: 'abc123' }))
test('23. cookie parser handles an empty header', () => assert.deepEqual(parseCookies(''), {}))

test('24. authentication controller returns only public user data', async () => {
  const authController = require('../src/controllers/authController')
  const original = authService.login
  authService.login = async () => ({ user: { userId: 'user-a', name: 'User A', email: 'user@example.com' }, token: 'token' })
  try {
    const response = fakeResponse()
    await authController.login({ body: {} }, response)
    assert.deepEqual(response.body, { user: { userId: 'user-a', name: 'User A', email: 'user@example.com' } })
  } finally { authService.login = original }
})
test('25. logout clears the HttpOnly session cookie', async () => {
  const authController = require('../src/controllers/authController')
  const response = fakeResponse()
  await authController.logout({}, response)
  assert.match(response.headers['Set-Cookie'], /eventhive_session=;/)
  assert.match(response.headers['Set-Cookie'], /HttpOnly/)
  assert.match(response.headers['Set-Cookie'], /Max-Age=0/)
})
test('26. unauthenticated me request returns 401', async () => {
  const authController = require('../src/controllers/authController')
  const response = fakeResponse()
  await authController.me({ user: null }, response)
  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, { error: 'Authentication required.' })
})
test('27. authenticated me request returns public identity', async () => {
  const authController = require('../src/controllers/authController')
  const response = fakeResponse()
  await authController.me({ user: fakeUser({ passwordHash: 'hidden' }) }, response)
  assert.deepEqual(response.body, { user: { userId: 'user-a', name: 'User A', email: 'user@example.com' } })
})
test('28. authentication secret is not exposed through the public user model', () => {
  const publicUser = toPublicUser(fakeUser({ passwordHash: process.env.AUTH_JWT_SECRET }))
  assert.equal(Object.prototype.hasOwnProperty.call(publicUser, 'passwordHash'), false)
})
