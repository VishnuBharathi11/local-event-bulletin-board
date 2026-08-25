const express = require('express')
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController')

const router = express.Router()

router.get('/events', getEvents)
router.get('/events/:eventId', getEventById)
router.post('/events', createEvent)
router.put('/events/:eventId', updateEvent)
router.patch('/events/:eventId', updateEvent)
router.delete('/events/:eventId', deleteEvent)

module.exports = router
