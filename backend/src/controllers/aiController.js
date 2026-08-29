const eventDescriptionService = require('../services/eventDescriptionService')

function handleError(res, error, operation) {
  if (error instanceof TypeError) return res.status(400).json({ error: error.message })
  if (error.code === 'GEMINI_NOT_CONFIGURED') return res.status(503).json({ error: 'AI description service is not configured' })
  if (error.code === 'EVENT_DESCRIPTION_EMPTY' || error.code === 'EVENT_DESCRIPTION_TOO_LONG') {
    return res.status(502).json({ error: 'Unable to generate a valid event description right now. Please enter one manually or try again.' })
  }
  console.error(`${operation} failed`, { message: error.message, code: error.code })
  return res.status(500).json({ error: 'Unable to generate an event description right now.' })
}

async function generateEventDescription(req, res) {
  try {
    const description = await eventDescriptionService.generateDescription(req.body || {})
    return res.json({ description })
  } catch (error) {
    return handleError(res, error, 'POST /api/ai/event-description')
  }
}

module.exports = { generateEventDescription }
