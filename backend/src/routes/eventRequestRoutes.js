const express = require('express')
const {
  getEventRequests,
  getUserEventRequests,
  getEventRequestById,
  createEventRequest,
  updateEventRequest,
  deleteEventRequest,
  getInterestStatus,
  expressInterest,
  removeInterest,
  confirmEventRequest,
  confirmEventRequestAnyway,
  declineEventRequest,
} = require('../controllers/eventRequestController')
const { authenticate, attachUser } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/event-requests', attachUser, getEventRequests)
router.get('/event-requests/mine', authenticate, getUserEventRequests)
router.get('/event-requests/:requestId', getEventRequestById)
router.post('/event-requests', authenticate, createEventRequest)
router.patch('/event-requests/:requestId', authenticate, updateEventRequest)
router.delete('/event-requests/:requestId', authenticate, deleteEventRequest)
router.get('/event-requests/:requestId/interest', authenticate, getInterestStatus)
router.post('/event-requests/:requestId/interest', authenticate, expressInterest)
router.delete('/event-requests/:requestId/interest', authenticate, removeInterest)
router.post('/event-requests/:requestId/confirm', authenticate, confirmEventRequest)
router.post('/event-requests/:requestId/confirm-anyway', authenticate, confirmEventRequestAnyway)
router.post('/event-requests/:requestId/decline', authenticate, declineEventRequest)

module.exports = router
