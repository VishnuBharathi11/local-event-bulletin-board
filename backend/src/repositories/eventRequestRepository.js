const { getFirestore } = require('../config/firebaseAdmin')
const { fromFirestoreDocument, toFirestoreEventRequest } = require('../models/eventRequestModel')

const EVENT_REQUESTS_COLLECTION = 'eventRequests'
const INTEREST_COLLECTION = 'eventRequestInterest'
const ACTIVE_REQUEST_STATUSES = Object.freeze(['COLLECTING_DEMAND', 'THRESHOLD_REACHED'])

function getRequestCollection() { return getFirestore().collection(EVENT_REQUESTS_COLLECTION) }
function getInterestCollection() { return getFirestore().collection(INTEREST_COLLECTION) }

function buildActiveEventRequestQuery(collection) {
  return collection
    .where('status', 'in', ACTIVE_REQUEST_STATUSES)
    .orderBy('createdAt', 'desc')
}

async function getEventRequests() {
  const snapshot = await buildActiveEventRequestQuery(getRequestCollection()).get()
  return snapshot.docs.map(fromFirestoreDocument)
}

async function getEventRequestById(requestId) {
  const snapshot = await getRequestCollection().doc(requestId).get()
  return fromFirestoreDocument(snapshot)
}

async function createEventRequest(request) {
  const document = getRequestCollection().doc()
  const fields = toFirestoreEventRequest(request)
  await document.set(fields)
  return { ...fields, requestId: document.id }
}

async function hasUserExpressedInterest(requestId, userId) {
  const snapshot = await getInterestCollection().doc(`${requestId}_${userId}`).get()
  return snapshot.exists
}

async function expressInterest(requestId, userId) {
  const firestore = getFirestore()
  const interestRef = getInterestCollection().doc(`${requestId}_${userId}`)
  const requestRef = getRequestCollection().doc(requestId)

  await firestore.runTransaction(async (transaction) => {
    const interestSnapshot = await transaction.get(interestRef)
    const requestSnapshot = await transaction.get(requestRef)
    if (!requestSnapshot.exists) throw new Error('Event request not found')
    if (!interestSnapshot.exists) {
      const request = fromFirestoreDocument(requestSnapshot)
      const newCount = request.demandCount + 1
      transaction.set(interestRef, { interestId: `${requestId}_${userId}`, requestId, userId, createdAt: Date.now() })
      transaction.update(requestRef, {
        demandCount: newCount,
        ...(newCount >= request.demandThreshold ? { status: 'THRESHOLD_REACHED' } : {}),
      })
    }
  })
  return getEventRequestById(requestId)
}

async function confirmEventRequest(requestId) {
  const firestore = getFirestore()
  const requestRef = getRequestCollection().doc(requestId)
  let createdEvent = null

  await firestore.runTransaction(async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef)
    const request = fromFirestoreDocument(requestSnapshot)
    if (!request) throw new Error('Event request not found')
    if (request.status !== 'THRESHOLD_REACHED') throw new Error('Event request has not reached the demand threshold')

    const eventRef = firestore.collection('events').doc()
    createdEvent = {
      eventId: eventRef.id,
      title: request.title,
      description: request.description,
      category: request.category,
      city: request.city,
      neighborhood: request.neighborhood,
      location: request.location,
      startTime: request.startTime,
      endTime: request.endTime,
      status: 'PUBLISHED',
      rsvpCount: 0,
      organizerId: request.organizerId,
      createdAt: Date.now(),
      expireAt: request.endTime,
      conflictStatus: 'NONE',
      imageUrl: request.imageUrl || '',
    }
    const { eventId: _eventId, ...eventFields } = createdEvent
    transaction.set(eventRef, eventFields)
    transaction.update(requestRef, { status: 'CONFIRMED' })
  })
  return createdEvent
}

async function declineEventRequest(requestId) {
  const requestRef = getRequestCollection().doc(requestId)
  const snapshot = await requestRef.get()
  if (!snapshot.exists) throw new Error('Event request not found')
  await requestRef.update({ status: 'DECLINED' })
}

module.exports = {
  EVENT_REQUESTS_COLLECTION,
  INTEREST_COLLECTION,
  ACTIVE_REQUEST_STATUSES,
  buildActiveEventRequestQuery,
  getEventRequests,
  getEventRequestById,
  createEventRequest,
  hasUserExpressedInterest,
  expressInterest,
  confirmEventRequest,
  declineEventRequest,
}
