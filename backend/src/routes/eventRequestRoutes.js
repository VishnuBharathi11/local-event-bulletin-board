const express = require('express')
const {
  getEventRequests,
  getEventRequestById,
  createEventRequest,
  getInterestStatus,
  expressInterest,
  confirmEventRequest,
  declineEventRequest,
} = require('../controllers/eventRequestController')

const router = express.Router()

router.get('/event-requests', getEventRequests)
router.get('/event-requests/:requestId', getEventRequestById)
router.post('/event-requests', createEventRequest)
router.get('/event-requests/:requestId/interest', getInterestStatus)
router.post('/event-requests/:requestId/interest', expressInterest)
router.post('/event-requests/:requestId/confirm', confirmEventRequest)
router.post('/event-requests/:requestId/decline', declineEventRequest)

module.exports = router
