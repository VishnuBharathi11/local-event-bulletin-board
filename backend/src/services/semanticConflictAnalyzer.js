const { canonicalizeEvent } = require('./eventCanonicalization')
const { generateEventEmbedding } = require('./eventEmbeddingService')
const { findSimilarEvents } = require('./semanticSimilarityService')
const { buildSemanticConflictResult } = require('./semanticConflictService')

const DEFAULT_CANDIDATE_LIMIT = 20

function stripEmbeddingMetadata(event = {}) {
  const { embedding, embeddingModel, embeddingDimensions, embeddingTaskType, embeddingConfigVersion, embeddingUpdatedAt, ...publicEvent } = event
  return publicEvent
}

function hasConflictSignal(conflict) {
  return conflict.semanticEvidence || conflict.conflictScore >= conflict.conflictThreshold
}

async function detectSemanticConflicts(proposedEvent, options = {}) {
  if (!proposedEvent || typeof proposedEvent !== 'object' || Array.isArray(proposedEvent)) {
    throw new TypeError('proposedEvent must be an object')
  }
  if (typeof proposedEvent.eventId !== 'string' || !proposedEvent.eventId.trim()) {
    throw new TypeError('proposedEvent.eventId is required')
  }

  const canonicalText = canonicalizeEvent(proposedEvent)
  const embeddingGenerator = options.embeddingGenerator || generateEventEmbedding
  const similaritySearcher = options.similaritySearcher || findSimilarEvents
  const candidateLimit = options.candidateLimit || DEFAULT_CANDIDATE_LIMIT

  const queryEmbedding = await embeddingGenerator(canonicalText)
  const candidates = await similaritySearcher(canonicalText, {
    limit: candidateLimit,
    distanceMeasure: 'COSINE',
  }, options.firestore, async () => queryEmbedding)

  const results = candidates
    .filter((candidate) => candidate.eventId !== proposedEvent.eventId)
    .map((candidate) => buildSemanticConflictResult(
      proposedEvent,
      candidate,
      candidate.distance,
      { threshold: options.semanticThreshold },
    ))
    .filter(hasConflictSignal)
    .sort((a, b) => b.conflictScore - a.conflictScore || (b.semanticSimilarity || 0) - (a.semanticSimilarity || 0))

  return results.map((result) => ({
    ...result,
    conflictingEvent: stripEmbeddingMetadata(candidates.find((event) => event.eventId === result.conflictingEventId) || {}),
  }))
}

module.exports = {
  DEFAULT_CANDIDATE_LIMIT,
  stripEmbeddingMetadata,
  hasConflictSignal,
  detectSemanticConflicts,
}
