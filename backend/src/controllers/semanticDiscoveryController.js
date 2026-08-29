const chatbotService = require('../services/chatbotService')
const semanticEventDiscoveryService = require('../services/semanticEventDiscoveryService')

function handleSemanticError(res, error, operation) {
  if (error instanceof TypeError) return res.status(400).json({ error: error.message })
  console.error(`${operation} failed`, { message: error.message, code: error.code })
  return res.status(500).json({ error: 'Semantic event discovery failed' })
}

async function semanticSearch(req, res) {
  try {
    const body = req.body || {}
    const results = await semanticEventDiscoveryService.searchSemantically(
      body.query,
      {
        limit: body.limit,
        category: body.category,
        city: body.city,
        distanceMeasure: body.distanceMeasure,
      },
    )
    return res.json({
      mode: 'semantic-event-discovery',
      query: typeof body.query === 'string' ? body.query.trim() : body.query,
      results,
    })
  } catch (error) {
    return handleSemanticError(res, error, 'POST /api/chatbot/semantic-search')
  }
}

async function similarEvents(req, res) {
  try {
    const event = await chatbotService.getEventDetails(req.params.eventId)
    if (!event) return res.status(404).json({ error: 'Event not found' })

    const results = await semanticEventDiscoveryService.findSimilarToEvent(event, {
      limit: req.query.limit,
      category: req.query.category,
      city: req.query.city,
      distanceMeasure: req.query.distanceMeasure,
    })

    return res.json({
      mode: 'similar-event-discovery',
      sourceEventId: event.eventId,
      results,
    })
  } catch (error) {
    return handleSemanticError(res, error, `GET /api/chatbot/events/${req.params.eventId}/similar`)
  }
}

module.exports = { semanticSearch, similarEvents }
