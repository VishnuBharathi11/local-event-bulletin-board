const { canonicalizeEvent } = require('./eventCanonicalization')
const { generateEventEmbedding } = require('./eventEmbeddingService')
const { saveEventEmbedding } = require('../repositories/eventEmbeddingRepository')

async function generateAndStoreEventEmbedding(event, options = {}) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new TypeError('event must be an object')
  if (typeof event.eventId !== 'string' || !event.eventId.trim()) throw new TypeError('event.eventId is required')

  const canonicalText = canonicalizeEvent(event)
  const embeddingResult = await (options.generateEmbedding || generateEventEmbedding)(canonicalText, options.config)
  await (options.saveEmbedding || saveEventEmbedding)(event.eventId, embeddingResult, options.firestore)

  return { eventId: event.eventId, canonicalText, ...embeddingResult }
}

module.exports = { generateAndStoreEventEmbedding }
