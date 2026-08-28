const chatbotService = require('../services/chatbotService')
const geminiService = require('../services/geminiService')
const orchestrationService = require('../services/orchestrationService')

function handleError(res, error, operation) {
  if (error instanceof TypeError) return res.status(400).json({ error: error.message })
  if (error.code === 'GEMINI_NOT_CONFIGURED') return res.status(503).json({ error: 'Gemini service is not configured' })
  console.error(`${operation} failed`, { message: error.message, code: error.code })
  return res.status(500).json({ error: 'Chatbot operation failed' })
}

function getCapabilities(req, res) {
  return res.json({
    ...chatbotService.getCapabilities(),
    phase4: { orchestration: true, supportedIntents: Object.values(orchestrationService.INTENTS), maxHistory: orchestrationService.MAX_HISTORY },
    gemini: { enabled: geminiService.isConfigured(), model: geminiService.DEFAULT_MODEL, mode: 'grounded-conversational-orchestration' },
  })
}

async function chat(req, res) {
  try {
    const body = req.body || {}
    return res.json(await orchestrationService.orchestrate({ message: body.message, history: body.history }))
  } catch (error) { return handleError(res, error, 'POST /api/chatbot/chat') }
}

async function explainTrends(req, res) {
  try {
    const body = req.body || {}
    const evidence = await chatbotService.getTrendAnalysis({ days: body.days, category: body.category, city: body.city })
    const explanation = await geminiService.explainTrendAnalysis(evidence, body.question)
    return res.json({ mode: 'grounded-trend-explanation', evidenceVersion: evidence.version, evidence, ...explanation })
  } catch (error) { return handleError(res, error, 'POST /api/chatbot/trends/explain') }
}

async function getUpcomingEvents(req, res) { try { return res.json(await chatbotService.getUpcomingEvents(req.query || {})) } catch (error) { return handleError(res, error, 'GET /api/chatbot/tools/upcoming-events') } }
async function getEventDetails(req, res) { try { const event = await chatbotService.getEventDetails(req.params.eventId); if (!event) return res.status(404).json({ error: 'Event not found' }); return res.json(event) } catch (error) { return handleError(res, error, 'GET /api/chatbot/tools/events/:eventId') } }
async function getCommunityDemand(req, res) { try { return res.json(await chatbotService.getCommunityDemand(req.query || {})) } catch (error) { return handleError(res, error, 'GET /api/chatbot/tools/community-demand') } }
async function getTrendAnalysis(req, res) { try { return res.json(await chatbotService.getTrendAnalysis(req.query || {})) } catch (error) { return handleError(res, error, 'GET /api/chatbot/tools/trend-analysis') } }

module.exports = { getCapabilities, chat, explainTrends, getUpcomingEvents, getEventDetails, getCommunityDemand, getTrendAnalysis }
