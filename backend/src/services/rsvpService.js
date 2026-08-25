const rsvpRepository = require('../repositories/rsvpRepository')

async function getRSVPStatus(eventId, userId) {
  return rsvpRepository.hasUserRSVPd(eventId, userId)
}

async function rsvpToEvent(eventId, userId) {
  await rsvpRepository.rsvpToEvent(eventId, userId)
}

async function removeRSVP(eventId, userId) {
  await rsvpRepository.removeRSVP(eventId, userId)
}

module.exports = { getRSVPStatus, rsvpToEvent, removeRSVP }
