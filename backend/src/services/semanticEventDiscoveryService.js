const { canonicalizeEvent } = require('./eventCanonicalization')
const { findSimilarEvents } = require('./semanticSimilarityService')

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 20

function validateLimit(limit = DEFAULT_LIMIT) {
  const value = Number(limit)
  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) throw new TypeError(`limit must be an integer between 1 and ${MAX_LIMIT}`)
  return value
}

function stripEmbeddingMetadata(event = {}) {
  const { embedding, embeddingModel, embeddingDimensions, embeddingTaskType, embeddingConfigVersion, embeddingUpdatedAt, _vectorDistance, ...publicEvent } = event
  return publicEvent
}

function normalizeDistance(distance) {
  const numeric = Number(distance)
  return Number.isFinite(numeric) ? numeric : null
}

function distanceToSimilarity(distance, distanceMeasure = 'COSINE') {
  const numeric = normalizeDistance(distance)
  if (numeric === null) return null
  switch (String(distanceMeasure).toUpperCase()) {
    case 'COSINE': return Math.max(0, Math.min(1, 1 - numeric))
    case 'EUCLIDEAN': return 1 / (1 + Math.max(0, numeric))
    case 'DOT_PRODUCT': return null
    default: throw new TypeError('unsupported distance measure')
  }
}

function buildQueryText(query = {}) {
  if (typeof query === 'string') {
    const text = query.trim()
    if (!text) throw new TypeError('semantic query text is required')
    return text
  }
  if (!query || typeof query !== 'object' || Array.isArray(query)) throw new TypeError('semantic query must be text or an object')
  const fields = [['Title', query.title], ['Description', query.description], ['Category', query.category], ['City', query.city], ['Neighborhood', query.neighborhood], ['Location', query.location]]
  const text = fields.filter(([, value]) => value !== undefined && value !== null && String(value).trim()).map(([label, value]) => `${label}: ${String(value).trim()}`).join('\n')
  if (!text) throw new TypeError('semantic query must contain searchable text')
  return text
}

function applyDeterministicFilters(results, options = {}) {
  return results.filter((event) => {
    if (options.category && String(event.category || '').toLowerCase() !== String(options.category).trim().toLowerCase()) return false
    if (options.city && String(event.city || '').toLowerCase() !== String(options.city).trim().toLowerCase()) return false
    return true
  })
}

function normalizeResults(results, options = {}) {
  const distanceMeasure = String(options.distanceMeasure || 'COSINE').toUpperCase()
  return results.map((event) => ({
    ...stripEmbeddingMetadata(event),
    distance: normalizeDistance(event.distance),
    semanticSimilarity: distanceToSimilarity(event.distance, distanceMeasure),
  }))
}

async function searchSemantically(query, options = {}, dependencies = {}) {
  const queryText = buildQueryText(query)
  const limit = validateLimit(options.limit)
  const distanceMeasure = String(options.distanceMeasure || 'COSINE').toUpperCase()
  const searcher = dependencies.searcher || findSimilarEvents
  const results = await searcher(queryText, { limit, distanceMeasure }, options.firestore)
  return normalizeResults(applyDeterministicFilters(results, options), { distanceMeasure })
}

async function findSimilarToEvent(event, options = {}, dependencies = {}) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new TypeError('event must be an object')
  const results = await searchSemantically(canonicalizeEvent(event), options, dependencies)
  return results.filter((candidate) => candidate.eventId !== event.eventId)
}

module.exports = { DEFAULT_LIMIT, MAX_LIMIT, validateLimit, stripEmbeddingMetadata, normalizeDistance, distanceToSimilarity, buildQueryText, applyDeterministicFilters, normalizeResults, searchSemantically, findSimilarToEvent }
