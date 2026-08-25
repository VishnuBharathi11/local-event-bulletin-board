const { getFirestore } = require('../config/firebaseAdmin')
const { fromFirestoreDocument, toFirestoreEvent } = require('../models/eventModel')

const EVENTS_COLLECTION = 'events'

function getEventCollection() {
  return getFirestore().collection(EVENTS_COLLECTION)
}

async function getEvents() {
  const snapshot = await getEventCollection().orderBy('startTime', 'asc').get()
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

async function deleteEvent(eventId) {
  const batch = getFirestore().batch()
  batch.delete(getEventCollection().doc(eventId))
  await batch.commit()
}

module.exports = {
  EVENTS_COLLECTION,
  getEvents,
  getEventById,
  saveEvent,
  deleteEvent,
}
