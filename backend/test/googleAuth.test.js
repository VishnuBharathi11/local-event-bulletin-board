const test = require('node:test')
const assert = require('node:assert/strict')

process.env.AUTH_JWT_SECRET = 'test-secret-with-at-least-32-characters-long'

const firebaseAdmin = require('../src/config/firebaseAdmin')
const userRepository = require('../src/repositories/userRepository')
const authService = require('../src/services/authService')
const authController = require('../src/controllers/authController')

const originalFirebaseAdmin = { getFirebaseAuth: firebaseAdmin.getFirebaseAuth }
const originalUserRepository = {
  createUser: userRepository.createUser,
  getUserByEmail: userRepository.getUserByEmail,
  getUserById: userRepository.getUserById,
}

function fakeResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    setHeader(name, value) {
      this.headers[name] = value
      return this
    },
    send() {
      return this
    },
  }
}

async function withMocks({ firebaseAuth, repo }, callback) {
  if (firebaseAuth) {
    firebaseAdmin.getFirebaseAuth = () => firebaseAuth
  }
  if (repo) {
    Object.assign(userRepository, repo)
  }
  try {
    return await callback()
  } finally {
    Object.assign(firebaseAdmin, originalFirebaseAdmin)
    Object.assign(userRepository, originalUserRepository)
  }
}

test('1. missing or empty ID token is rejected with 400', async () => {
  await assert.rejects(
    () => authService.loginWithGoogle(''),
    (error) => error.statusCode === 400 && error.message.includes('token is required')
  )
  await assert.rejects(
    () => authService.loginWithGoogle(null),
    (error) => error.statusCode === 400 && error.message.includes('token is required')
  )
})

test('2. invalid or expired Firebase token is rejected with 401', async () => {
  const mockAuth = {
    verifyIdToken: async () => {
      throw new Error('Firebase token expired or invalid')
    },
  }

  await withMocks({ firebaseAuth: mockAuth }, async () => {
    await assert.rejects(
      () => authService.loginWithGoogle('invalid-firebase-token'),
      (error) => error.statusCode === 401 && error.message.includes('could not be verified')
    )
  })
})

test('3. non-Google sign-in provider is rejected with 401', async () => {
  const mockAuth = {
    verifyIdToken: async () => ({
      email: 'user@example.com',
      email_verified: true,
      firebase: { sign_in_provider: 'password' },
    }),
  }

  await withMocks({ firebaseAuth: mockAuth }, async () => {
    await assert.rejects(
      () => authService.loginWithGoogle('valid-token-non-google'),
      (error) => error.statusCode === 401 && error.message.includes('Google authentication token is required')
    )
  })
})

test('4. unverified email is rejected with 403', async () => {
  const mockAuth = {
    verifyIdToken: async () => ({
      email: 'unverified@example.com',
      email_verified: false,
      firebase: { sign_in_provider: 'google.com' },
    }),
  }

  await withMocks({ firebaseAuth: mockAuth }, async () => {
    await assert.rejects(
      () => authService.loginWithGoogle('token-unverified-email'),
      (error) => error.statusCode === 403 && error.message.includes('email verification is required')
    )
  })
})

test('5. existing user with same verified email is reused without overwriting password or userId', async () => {
  const existingUser = {
    userId: 'existing-user-123',
    name: 'Existing User',
    email: 'test@example.com',
    passwordHash: 'scrypt$16384$8$1$existing-salt$existing-hash',
    createdAt: 1000,
  }

  let createUserCalled = false
  const mockRepo = {
    getUserByEmail: async (email) => (email === 'test@example.com' ? existingUser : null),
    createUser: async () => {
      createUserCalled = true
      throw new Error('Should not create new user')
    },
  }

  const mockAuth = {
    verifyIdToken: async () => ({
      email: '  TEST@EXAMPLE.COM  ',
      email_verified: true,
      name: 'Google Name',
      firebase: { sign_in_provider: 'google.com' },
    }),
  }

  await withMocks({ firebaseAuth: mockAuth, repo: mockRepo }, async () => {
    const result = await authService.loginWithGoogle('valid-google-token')
    assert.equal(createUserCalled, false)
    assert.equal(result.user.userId, 'existing-user-123')
    assert.equal(result.user.email, 'test@example.com')
    assert.equal(result.user.name, 'Existing User')
    assert.equal(result.user.passwordHash, undefined)
    assert.ok(result.token)

    const session = authService.verifySessionToken(result.token)
    assert.equal(session.sub, 'existing-user-123')
    assert.equal(session.iss, 'eventhive-api')
    assert.equal(session.aud, 'eventhive-web')
  })
})

test('6. unregistered Google user is rejected during login', async () => {
  let createUserCalled = false

  const mockRepo = {
    getUserByEmail: async () => null,
    createUser: async () => {
      createUserCalled = true
      throw new Error('Login must not create a user')
    },
  }

  const mockAuth = {
    verifyIdToken: async () => ({
      email: 'NewGoogleUser@Example.Com',
      email_verified: true,
      name: 'Jane Doe',
      firebase: { sign_in_provider: 'google.com' },
    }),
  }

  await withMocks(
    { firebaseAuth: mockAuth, repo: mockRepo },
    async () => {
      await assert.rejects(
        () => authService.loginWithGoogle('new-google-token', 'login'),
        (error) =>
          error.statusCode === 404 &&
          error.message === 'User does not exist. Please register first.'
      )

      assert.equal(createUserCalled, false)
    }
  )
})

test('7. Google registration creates a new user', async () => {
  let createdPayload = null

  const mockRepo = {
    getUserByEmail: async () => null,
    createUser: async (payload) => {
      createdPayload = payload

      return {
        ...payload,
        userId: 'new-google-user-789',
      }
    },
  }

  const mockAuth = {
    verifyIdToken: async () => ({
      email: 'NewGoogleUser@Example.Com',
      email_verified: true,
      name: 'Jane Doe',
      firebase: { sign_in_provider: 'google.com' },
    }),
  }

  await withMocks(
    { firebaseAuth: mockAuth, repo: mockRepo },
    async () => {
      const result = await authService.loginWithGoogle(
        'new-google-token',
        'register'
      )

      assert.ok(createdPayload)
      assert.equal(createdPayload.name, 'Jane Doe')
      assert.equal(
        createdPayload.email,
        'newgoogleuser@example.com'
      )
      assert.equal(createdPayload.passwordHash, '')

      assert.equal(result.user.userId, 'new-google-user-789')
      assert.equal(result.user.email, 'newgoogleuser@example.com')
      assert.equal(result.user.passwordHash, undefined)

      const session = authService.verifySessionToken(result.token)
      assert.equal(session.sub, 'new-google-user-789')
    }
  )
})