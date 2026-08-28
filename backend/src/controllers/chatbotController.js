const chatbotService = require('../services/chatbotService')

function handleError(res, error, operation) {
  if (error instanceof TypeError) return res.status(400).json({ error: error.message })
  console.error(`${operation} failed`, { message: error.message, code: error.code })
  return res.status(500).json({ error: 'Chatbot operation failed' })
}

function getCapabilities(req, res) {
  return res.json(chatbotService.getCapabilities())
}

async function chat(req, res) {
  try {
    return res.json(await chatbotService.processMessage(req.body || {}))
  } catch (error) {
    return handleError(res, error, 'POST /api/chatbot/chat')
  }
}

async function getUpcomingEvents(req, res) {
  try {
    return res.json(await chatbotService.getUpcomingEvents(req.query || {}))
  } catch (error) {
    return handleError(res, error, 'GET /api/chatbot/tools/upcoming-events')
  }
}

async function getEventDetails(req, res) {
  try {
    const event = await chatbotService.getEventDetails(req.params.eventId)
    if (!event) return res.status(404).json({ error: 'Event not found' })
    return res.json(event)
  } catch (error) {
    return handleError(res, error, 'GET /api/chatbot/tools/events/:eventId')
  }
}

async function getCommunityDemand(req, res) {
  try {
    return res.json(await chatbotService.getCommunityDemand(req.query || {}))
  } catch (error) {
    return handleError(res, error, 'GET /api/chatbot/tools/community-demand')
  }
}

async function getTrendAnalysis(req, res) {
  try {
    return res.json(await chatbotService.getTrendAnalysis(req.query || {}))
  } catch (error) {
    return handleError(res, error, 'GET /api/chatbot/tools/trend-analysis')
  }
}

module.exports = { getCapabilities, chat, getUpcomingEvents, getEventDetails, getCommunityDemand, getTrendAnalysis }
