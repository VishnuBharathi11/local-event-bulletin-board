const admin = require('firebase-admin')
const { getFirestore } = require('../config/firebaseAdmin')
const { EMBEDDING_CONFIG } = require('./eventEmbeddingConfig')
const { generateEventEmbedding } = require('./eventEmbeddingService')

const EVENTS_COLLECTION = 'events'
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 20
const DEFAULT_DISTANCE_MEASURE = 'COSINE'

function validateLimit(limit = DEFAULT_LIMIT) {
  const value = Number(limit)
  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) {
    throw new TypeError(`limit must be an integer between 1 and ${MAX_LIMIT}`)
  }
  return value
}

function validateDistanceMeasure(distanceMeasure = DEFAULT_DISTANCE_MEASURE) {
  const value = String(distanceMeasure).toUpperCase()
  if (!['COSINE', 'EUCLIDEAN', 'DOT_PRODUCT'].includes(value)) {
    throw new TypeError('distanceMeasure must be COSINE, EUCLIDEAN, or DOT_PRODUCT')
  }
  return value
}

function toFirestoreVector(vector) {
  if (!admin.firestore.FieldValue || typeof admin.firestore.FieldValue.vector !== 'function') {
    const error = new Error('Firestore vector FieldValue is unavailable in the installed Firebase Admin SDK')
    error.code = 'FIRESTORE_VECTOR_UNAVAILABLE'
    throw error
  }
  return admin.firestore.FieldValue.vector(vector)
}

async function findSimilarEventsByVector(queryVector, options = {}, firestore = getFirestore()) {
  const limit = validateLimit(options.limit)
  const distanceMeasure = validateDistanceMeasure(options.distanceMeasure)
  const vector = toFirestoreVector(queryVector)
  const collection = firestore.collection(EVENTS_COLLECTION)

  if (typeof collection.findNearest !== 'function') {
    const error = new Error('Firestore vector search is unavailable in the installed Firestore SDK')
    error.code = 'FIRESTORE_VECTOR_SEARCH_UNAVAILABLE'
    throw error
  }

  const vectorQuery = collection.findNearest('embedding', vector, {
    limit,
    distanceMeasure,
    distanceResultField: '_vectorDistance',
  })
  const snapshot = await vectorQuery.get()

  return snapshot.docs.map((doc) => ({
    eventId: doc.id,
    ...doc.data(),
    distance: doc.get('_vectorDistance'),
  }))
}

async function findSimilarEvents(canonicalText, options = {}, firestore = getFirestore(), embeddingGenerator = generateEventEmbedding) {
  if (typeof canonicalText !== 'string' || !canonicalText.trim()) {
    throw new TypeError('canonical event text is required')
  }
  const embedding = await embeddingGenerator(canonicalText, EMBEDDING_CONFIG)
  return findSimilarEventsByVector(embedding.vector, options, firestore)
}

module.exports = {
  EVENTS_COLLECTION,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  DEFAULT_DISTANCE_MEASURE,
  validateLimit,
  validateDistanceMeasure,
  findSimilarEventsByVector,
  findSimilarEvents,
}
