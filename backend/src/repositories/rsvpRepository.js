const { getFirestore } = require('../config/firebaseAdmin')

const RSVP_COLLECTION = 'eventRSVPs'

function getRSVPCollection() {
  return getFirestore().collection(RSVP_COLLECTION)
}

function getRSVPId(eventId, userId) {
  return `${eventId}_${userId}`
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
    if (!eventSnapshot.exists) {
      const error = new Error('Event not found.')
      error.code = 'EVENT_NOT_FOUND'
      throw error
    }

    const currentCount = Number(eventSnapshot.get('rsvpCount') || 0)
    const now = Date.now()
    transaction.set(rsvpRef, {
      rsvpId: getRSVPId(eventId, userId),
      eventId,
      userId,
      createdAt: now,
    })
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
    if (!eventSnapshot.exists) {
      const error = new Error('Event not found.')
      error.code = 'EVENT_NOT_FOUND'
      throw error
    }

    const currentCount = Number(eventSnapshot.get('rsvpCount') || 0)
    transaction.delete(rsvpRef)
    transaction.update(eventRef, 'rsvpCount', Math.max(currentCount - 1, 0))
  })
}

module.exports = {
  RSVP_COLLECTION,
  getRSVPId,
  hasUserRSVPd,
  rsvpToEvent,
  removeRSVP,
}
