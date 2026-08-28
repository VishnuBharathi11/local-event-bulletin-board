const { getFirestore } = require('../config/firebaseAdmin')

const RSVP_COLLECTION = 'eventRSVPs'

function getRSVPCollection() {
  return getFirestore().collection(RSVP_COLLECTION)
}

function getRSVPId(eventId, userId) {
  return `${eventId}_${userId}`
}

async function getRecentRSVPs(startTime, endTime = Date.now()) {
  const snapshot = await getRSVPCollection().orderBy('createdAt', 'asc').get()
  return snapshot.docs.map((doc) => doc.data())
    .filter((rsvp) => Number(rsvp.createdAt) >= startTime && Number(rsvp.createdAt) <= endTime)
}

async function hasUserRSVPd(eventId, userId) {
  const snapshot = await getRSVPCollection().doc(getRSVPId(eventId, userId)).get()
  return snapshot.exists
}

async function rsvpToEvent(eventId, userId) {
  const firestore = getFirestore()
  const rsvpRef = getRSVPCollection().doc(getRSVPId(eventId, userId))
  const eventRef = firestore.collection('events').doc(eventId)

  await firestore.runTransaction(async (transaction) => {
    const rsvpSnapshot = await transaction.get(rsvpRef)
    if (rsvpSnapshot.exists) return
    const eventSnapshot = await transaction.get(eventRef)
    if (!eventSnapshot.exists) throw Object.assign(new Error('Event not found.'), { code: 'EVENT_NOT_FOUND' })
    const startTime = Number(eventSnapshot.get('startTime') || 0)
    const endTime = Number(eventSnapshot.get('endTime') || eventSnapshot.get('expireAt') || 0)
    const now = Date.now()
    if (endTime > 0 && now >= endTime) throw Object.assign(new Error('This event has ended.'), { code: 'EVENT_ENDED' })
    if (startTime > 0 && now >= startTime) throw Object.assign(new Error('RSVP is closed because this event is ongoing.'), { code: 'EVENT_ONGOING' })
    const currentCount = Number(eventSnapshot.get('rsvpCount') || 0)
    transaction.set(rsvpRef, { rsvpId: getRSVPId(eventId, userId), eventId, userId, createdAt: now })
    transaction.update(eventRef, 'rsvpCount', currentCount + 1)
  })
}

async function removeRSVP(eventId, userId) {
  const firestore = getFirestore()
  const rsvpRef = getRSVPCollection().doc(getRSVPId(eventId, userId))
  const eventRef = firestore.collection('events').doc(eventId)
  await firestore.runTransaction(async (transaction) => {
    const rsvpSnapshot = await transaction.get(rsvpRef)
    if (!rsvpSnapshot.exists) return
    const eventSnapshot = await transaction.get(eventRef)
    if (!eventSnapshot.exists) throw Object.assign(new Error('Event not found.'), { code: 'EVENT_NOT_FOUND' })
    const currentCount = Number(eventSnapshot.get('rsvpCount') || 0)
    transaction.delete(rsvpRef)
    transaction.update(eventRef, 'rsvpCount', Math.max(currentCount - 1, 0))
  })
}

module.exports = { RSVP_COLLECTION, getRSVPId, getRecentRSVPs, hasUserRSVPd, rsvpToEvent, removeRSVP }
