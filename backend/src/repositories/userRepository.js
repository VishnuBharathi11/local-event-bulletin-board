const crypto = require('node:crypto')
const { getFirestore } = require('../config/firebaseAdmin')
const { fromFirestoreDocument, toFirestoreUser, normalizeEmail } = require('../models/userModel')

const USERS_COLLECTION = 'users'

function getUserCollection() {
  return getFirestore().collection(USERS_COLLECTION)
}

function userIdForEmail(email) {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex')
}

async function getUserById(userId) {
  const snapshot = await getUserCollection().doc(userId).get()
  return fromFirestoreDocument(snapshot)
}

async function getUserByEmail(email) {
  const snapshot = await getUserCollection().doc(userIdForEmail(email)).get()
  return fromFirestoreDocument(snapshot)
}

async function createUser(user) {
  const userId = userIdForEmail(user.email)
  const document = getUserCollection().doc(userId)
  const entity = toFirestoreUser({ ...user, userId })
  const db = getFirestore()

  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(document)
    if (existing.exists) {
      const error = new Error('An account with this email already exists.')
      error.code = 'DUPLICATE_EMAIL'
      throw error
    }
    transaction.create(document, entity)
  })

  return { ...entity, userId }
}

async function updateUser(userId, updates) {
  const document = getUserCollection().doc(userId)
  await document.update(updates)
  const snapshot = await document.get()
  return fromFirestoreDocument(snapshot)
}

module.exports = { USERS_COLLECTION, userIdForEmail, getUserById, getUserByEmail, createUser, updateUser }
