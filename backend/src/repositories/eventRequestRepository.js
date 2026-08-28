const { getFirestore } = require('../config/firebaseAdmin')
const { fromFirestoreDocument, toFirestoreEventRequest } = require('../models/eventRequestModel')

const EVENT_REQUESTS_COLLECTION = 'eventRequests'
const INTEREST_COLLECTION = 'eventRequestInterest'
const ACTIVE_REQUEST_STATUSES = Object.freeze(['COLLECTING_DEMAND', 'THRESHOLD_REACHED'])

function getRequestCollection() { return getFirestore().collection(EVENT_REQUESTS_COLLECTION) }
function getInterestCollection() { return getFirestore().collection(INTEREST_COLLECTION) }

function buildActiveEventRequestQuery(collection) {
  return collection.where('status', 'in', ACTIVE_REQUEST_STATUSES).orderBy('createdAt', 'desc')
}

async function getEventRequests() {
  const snapshot = await buildActiveEventRequestQuery(getRequestCollection()).get()
  return snapshot.docs.map(fromFirestoreDocument)
}

async function getUserEventRequests(userId) {
  const snapshot = await getRequestCollection().where('organizerId', '==', userId).get()
  return snapshot.docs.map(fromFirestoreDocument).sort((a, b) => b.createdAt - a.createdAt)
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

async function updateEventRequest(requestId, updates) {
  const document = getRequestCollection().doc(requestId)
  await document.update(updates)
  const snapshot = await document.get()
  return fromFirestoreDocument(snapshot)
}

async function deleteEventRequest(requestId) {
  const firestore = getFirestore()
  const requestRef = getRequestCollection().doc(requestId)
  const interestSnapshot = await getInterestCollection().where('requestId', '==', requestId).get()
  await firestore.runTransaction(async (transaction) => {
    transaction.delete(requestRef)
    interestSnapshot.docs.forEach((doc) => transaction.delete(doc.ref))
  })
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
      if (request.status !== 'COLLECTING_DEMAND') throw Object.assign(new Error('Interest is not available for this request.'), { statusCode: 409 })
      const newCount = request.demandCount + 1
      transaction.set(interestRef, { interestId: `${requestId}_${userId}`, requestId, userId, createdAt: Date.now() })
      transaction.update(requestRef, { demandCount: newCount, ...(newCount >= request.demandThreshold ? { status: 'THRESHOLD_REACHED' } : {}) })
    }
  })
  return getEventRequestById(requestId)
}

async function removeInterest(requestId, userId) {
  const firestore = getFirestore()
  const interestRef = getInterestCollection().doc(`${requestId}_${userId}`)
  const requestRef = getRequestCollection().doc(requestId)

  await firestore.runTransaction(async (transaction) => {
    const interestSnapshot = await transaction.get(interestRef)
    if (!interestSnapshot.exists) return
    const requestSnapshot = await transaction.get(requestRef)
    if (!requestSnapshot.exists) throw new Error('Event request not found')
    const request = fromFirestoreDocument(requestSnapshot)
    if (request.status === 'CONFIRMED') throw Object.assign(new Error('Interest cannot be changed after confirmation.'), { statusCode: 409 })

    const newCount = Math.max(Number(request.demandCount || 0) - 1, 0)
    const nextStatus = request.status === 'THRESHOLD_REACHED' && newCount < request.demandThreshold ? 'COLLECTING_DEMAND' : request.status
    transaction.delete(interestRef)
    transaction.update(requestRef, { demandCount: newCount, status: nextStatus })
  })
  return getEventRequestById(requestId)
}

async function confirmEventRequest(requestId) {
  const firestore = getFirestore()
  const requestRef = getRequestCollection().doc(requestId)
  let createdEvent = null
  const initialSnapshot = await requestRef.get()
  const initialRequest = fromFirestoreDocument(initialSnapshot)
  if (initialRequest && initialRequest.status === 'CONFIRMED' && initialRequest.eventId) {
    const existingEventSnapshot = await firestore.collection('events').doc(initialRequest.eventId).get()
    if (existingEventSnapshot.exists) return { ...existingEventSnapshot.data(), eventId: existingEventSnapshot.id }
  }

  await firestore.runTransaction(async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef)
    const request = fromFirestoreDocument(requestSnapshot)
    if (!request) throw new Error('Event request not found')
    if (request.status === 'CONFIRMED' && request.eventId) return
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
      district: request.district,
      startTime: request.startTime,
      endTime: request.endTime,
      status: 'PUBLISHED',
      rsvpCount: 0,
      organizerId: request.organizerId,
      createdAt: Date.now(),
      expireAt: request.endTime,
      conflictStatus: 'NONE',
      imageUrl: request.imageUrl || '',
      latitude: request.latitude ?? null,
      longitude: request.longitude ?? null,
    }
    const { eventId: _eventId, ...eventFields } = createdEvent
    transaction.set(eventRef, eventFields)
    transaction.update(requestRef, { status: 'CONFIRMED', eventId: eventRef.id })
  })

  if (!createdEvent && initialRequest.eventId) {
    const finalEventSnapshot = await firestore.collection('events').doc(initialRequest.eventId).get()
    return { ...finalEventSnapshot.data(), eventId: initialRequest.eventId }
  }
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
  getUserEventRequests,
  getEventRequestById,
  createEventRequest,
  updateEventRequest,
  deleteEventRequest,
  hasUserExpressedInterest,
  expressInterest,
  removeInterest,
  confirmEventRequest,
  declineEventRequest,
}
