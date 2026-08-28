const express = require('express')
const {
  getCapabilities,
  chat,
  explainTrends,
  getUpcomingEvents,
  getEventDetails,
  getCommunityDemand,
  getTrendAnalysis,
} = require('../controllers/chatbotController')

const router = express.Router()

router.get('/chatbot/capabilities', getCapabilities)
router.post('/chatbot/chat', chat)
router.post('/chatbot/trends/explain', explainTrends)
router.get('/chatbot/tools/upcoming-events', getUpcomingEvents)
router.get('/chatbot/tools/events/:eventId', getEventDetails)
router.get('/chatbot/tools/community-demand', getCommunityDemand)
router.get('/chatbot/tools/trend-analysis', getTrendAnalysis)

module.exports = router
