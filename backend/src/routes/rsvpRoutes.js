const express = require('express')
const { getRSVPStatus, createRSVP, deleteRSVP } = require('../controllers/rsvpController')

const router = express.Router()

router.get('/events/:eventId/rsvp', getRSVPStatus)
router.post('/events/:eventId/rsvp', createRSVP)
router.delete('/events/:eventId/rsvp', deleteRSVP)

module.exports = router
