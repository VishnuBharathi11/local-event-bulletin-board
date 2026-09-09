const { getFirestore } = require('../config/firebaseAdmin')
const { fromFirestoreDocument, toFirestoreEventConflict } = require('../models/eventConflictModel')

const EVENT_CONFLICTS_COLLECTION = 'eventConflicts'

function getConflictCollection() {
  return getFirestore().collection(EVENT_CONFLICTS_COLLECTION)
}

async function saveConflict(conflict) {
  const normalized = { ...conflict, createdAt: conflict.createdAt || Date.now() }
  const documentId = normalized.conflictId || `${normalized.eventId}_${normalized.conflictingEventId}`
  const fields = toFirestoreEventConflict(normalized)
  await getConflictCollection().doc(documentId).set(fields)
  return { ...fields, conflictId: documentId }
}

async function getConflictsForEvent(eventId) {
  const snapshot = await getConflictCollection().where('eventId', '==', eventId).get()
  return snapshot.docs.map(fromFirestoreDocument)
}

module.exports = { EVENT_CONFLICTS_COLLECTION, saveConflict, getConflictsForEvent }
