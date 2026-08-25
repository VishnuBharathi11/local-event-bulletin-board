const { getDevelopmentUserId } = require('../config/developmentUser')
const rsvpService = require('../services/rsvpService')

async function getRSVPStatus(req, res) {
  try {
    const going = await rsvpService.getRSVPStatus(req.params.eventId, getDevelopmentUserId())
    return res.status(200).json({ going })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to check RSVP status.' })
  }
}

async function createRSVP(req, res) {
  try {
    await rsvpService.rsvpToEvent(req.params.eventId, getDevelopmentUserId())
    return res.status(200).json({ going: true })
  } catch (error) {
    if (error.code === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: 'Event not found.' })
    }
    return res.status(500).json({ error: error.message || 'Unable to RSVP to this event.' })
  }
}

async function deleteRSVP(req, res) {
  try {
    await rsvpService.removeRSVP(req.params.eventId, getDevelopmentUserId())
    return res.status(200).json({ going: false })
  } catch (error) {
    if (error.code === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: 'Event not found.' })
    }
    return res.status(500).json({ error: error.message || 'Unable to remove RSVP.' })
  }
}

module.exports = { getRSVPStatus, createRSVP, deleteRSVP }
