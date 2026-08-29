const express = require('express')
const {
  getEvents,
  getMyEvents,
  getEventById,
  createEvent,
  checkEventConflicts,
  createEventAnyway,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController')
const { authenticate, attachUser } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/events', attachUser, getEvents)
router.get('/events/mine', authenticate, getMyEvents)
router.get('/events/:eventId', getEventById)
router.post('/events/conflicts/check', authenticate, checkEventConflicts)
router.post('/events/conflicts/continue', authenticate, createEventAnyway)
router.post('/events', authenticate, createEvent)
router.put('/events/:eventId', authenticate, updateEvent)
router.patch('/events/:eventId', authenticate, updateEvent)
router.delete('/events/:eventId', authenticate, deleteEvent)

module.exports = router
