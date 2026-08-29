const express = require('express')
const { getRSVPStatus, createRSVP, deleteRSVP } = require('../controllers/rsvpController')
const { authenticate } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/events/:eventId/rsvp', authenticate, getRSVPStatus)
router.post('/events/:eventId/rsvp', authenticate, createRSVP)
router.delete('/events/:eventId/rsvp', authenticate, deleteRSVP)

module.exports = router
