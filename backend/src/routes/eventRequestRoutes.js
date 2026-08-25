const express = require('express')
const {
  getEventRequests,
  getEventRequestById,
  createEventRequest,
  getInterestStatus,
  expressInterest,
  confirmEventRequest,
  confirmEventRequestAnyway,
  declineEventRequest,
} = require('../controllers/eventRequestController')
const { authenticate } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/event-requests', getEventRequests)
router.get('/event-requests/:requestId', getEventRequestById)
router.post('/event-requests', authenticate, createEventRequest)
router.get('/event-requests/:requestId/interest', authenticate, getInterestStatus)
router.post('/event-requests/:requestId/interest', authenticate, expressInterest)
router.post('/event-requests/:requestId/confirm', authenticate, confirmEventRequest)
router.post('/event-requests/:requestId/confirm-anyway', authenticate, confirmEventRequestAnyway)
router.post('/event-requests/:requestId/decline', authenticate, declineEventRequest)

module.exports = router
