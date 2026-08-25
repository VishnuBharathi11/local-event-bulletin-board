const express = require('express')
const {
  getEvents,
  getEventById,
  createEvent,
  checkEventConflicts,
  createEventAnyway,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController')
const { authenticate } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/events', getEvents)
router.get('/events/:eventId', getEventById)
router.post('/events/conflicts/check', authenticate, checkEventConflicts)
router.post('/events/conflicts/continue', authenticate, createEventAnyway)
router.post('/events', authenticate, createEvent)
router.put('/events/:eventId', authenticate, updateEvent)
router.patch('/events/:eventId', authenticate, updateEvent)
router.delete('/events/:eventId', authenticate, deleteEvent)

module.exports = router
