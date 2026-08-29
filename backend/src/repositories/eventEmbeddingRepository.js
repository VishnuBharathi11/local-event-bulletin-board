const { getFirestore } = require('../config/firebaseAdmin')
const admin = require('firebase-admin')
const { EMBEDDING_CONFIG } = require('../services/eventEmbeddingConfig')
const { validateEmbeddingVector } = require('../services/embeddingValidator')

const EVENTS_COLLECTION = 'events'

function toFirestoreVector(vector) {
  validateEmbeddingVector(vector, EMBEDDING_CONFIG.dimensions)
  const fieldValue = admin.firestore.FieldValue
  if (!fieldValue || typeof fieldValue.vector !== 'function') {
    const error = new Error('Firestore vector FieldValue is unavailable in the installed Firebase Admin SDK')
    error.code = 'FIRESTORE_VECTOR_UNAVAILABLE'
    throw error
  }
  return fieldValue.vector(vector)
}

function buildEmbeddingMetadata(embeddingResult) {
  validateEmbeddingVector(embeddingResult?.vector, EMBEDDING_CONFIG.dimensions)
  if (embeddingResult.embeddingModel !== EMBEDDING_CONFIG.model) throw new TypeError('embedding model does not match configured model')
  if (embeddingResult.embeddingDimensions !== EMBEDDING_CONFIG.dimensions) throw new TypeError('embedding dimensions do not match configured dimensions')
  if (embeddingResult.embeddingTaskType !== EMBEDDING_CONFIG.taskType) throw new TypeError('embedding task type does not match configured task type')
  if (embeddingResult.embeddingConfigVersion !== EMBEDDING_CONFIG.configVersion) throw new TypeError('embedding config version does not match configured version')

  return {
    embedding: toFirestoreVector(embeddingResult.vector),
    embeddingModel: embeddingResult.embeddingModel,
    embeddingDimensions: embeddingResult.embeddingDimensions,
    embeddingTaskType: embeddingResult.embeddingTaskType,
    embeddingConfigVersion: embeddingResult.embeddingConfigVersion,
    embeddingUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }
}

async function saveEventEmbedding(eventId, embeddingResult, firestore = getFirestore()) {
  if (typeof eventId !== 'string' || !eventId.trim()) throw new TypeError('eventId is required')
  const metadata = buildEmbeddingMetadata(embeddingResult)
  await firestore.collection(EVENTS_COLLECTION).doc(eventId.trim()).set(metadata, { merge: true })
  return metadata
}

module.exports = { EVENTS_COLLECTION, toFirestoreVector, buildEmbeddingMetadata, saveEventEmbedding }
