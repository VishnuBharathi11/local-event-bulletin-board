const admin = require('firebase-admin')
const { getFirestore } = require('../config/firebaseAdmin')
const { fromFirestoreDocument, toFirestoreEvent } = require('../models/eventModel')

const EVENTS_COLLECTION = 'events'

function getEventCollection() {
  return getFirestore().collection(EVENTS_COLLECTION)
}

function isEventExpired(event, now = Date.now()) {
  return now >= Number(event.expireAt)
}

function filterActiveEvents(events = [], now = Date.now()) {
  return events.filter((event) => !isEventExpired(event, now))
}

async function getEvents() {
  const snapshot = await getEventCollection().orderBy('startTime', 'asc').get()
  return snapshot.docs.map(fromFirestoreDocument)
}

async function getActiveEvents(now = Date.now()) {
  return filterActiveEvents(await getEvents(), now)
}

async function getUserEvents(userId) {
  const snapshot = await getEventCollection()
    .where('organizerId', '==', userId)
    .orderBy('startTime', 'asc')
    .get()
  return snapshot.docs.map(fromFirestoreDocument)
}

async function getEventById(eventId) {
  const snapshot = await getEventCollection().doc(eventId).get()
  return fromFirestoreDocument(snapshot)
}

async function saveEvent(event) {
  const entity = toFirestoreEvent(event)
  const collection = getEventCollection()

  if (!event.eventId) {
    const document = collection.doc()
    const eventWithId = { ...entity }
    await document.set(eventWithId)
    return { ...eventWithId, eventId: document.id }
  }

  await collection.doc(event.eventId).set(entity)
  return { ...entity, eventId: event.eventId }
}

async function saveEventEmbedding(eventId, embedding) {
  if (typeof eventId !== 'string' || !eventId.trim()) throw new TypeError('eventId is required')
  if (!embedding || !Array.isArray(embedding.vector)) throw new TypeError('embedding vector is required')
  if (!admin.firestore.FieldValue || typeof admin.firestore.FieldValue.vector !== 'function') {
    const error = new Error('Firestore vector FieldValue is unavailable in the installed Firebase Admin SDK')
    error.code = 'FIRESTORE_VECTOR_UNAVAILABLE'
    throw error
  }

  await getEventCollection().doc(eventId).set({
    embedding: admin.firestore.FieldValue.vector(embedding.vector),
    embeddingModel: embedding.embeddingModel,
    embeddingDimensions: embedding.embeddingDimensions,
    embeddingTaskType: embedding.embeddingTaskType,
    embeddingConfigVersion: embedding.embeddingConfigVersion,
    embeddingUpdatedAt: Date.now(),
  }, { merge: true })
}

async function deleteEvent(eventId) {
  const batch = getFirestore().batch()
  batch.delete(getEventCollection().doc(eventId))
  await batch.commit()
}

module.exports = {
  EVENTS_COLLECTION,
  getEvents,
  getActiveEvents,
  getUserEvents,
  getEventById,
  saveEvent,
  saveEventEmbedding,
  deleteEvent,
  isEventExpired,
  filterActiveEvents,
}
