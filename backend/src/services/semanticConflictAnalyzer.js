const { canonicalizeEvent } = require('./eventCanonicalization')
const { findSimilarEvents } = require('./semanticSimilarityService')
const { buildSemanticConflictResult } = require('./semanticConflictService')

const DEFAULT_CANDIDATE_LIMIT = 20

function stripEmbeddingMetadata(event = {}) {
  const { embedding, embeddingModel, embeddingDimensions, embeddingTaskType, embeddingConfigVersion, embeddingUpdatedAt, ...publicEvent } = event
  return publicEvent
}

function hasConflictSignal(conflict) {
  // Semantic similarity is supporting evidence. The deterministic conflict
  // threshold remains the decision boundary; semantics can strengthen it.
  return conflict.conflictScore >= conflict.conflictThreshold
}

async function detectSemanticConflicts(proposedEvent, options = {}) {
  if (!proposedEvent || typeof proposedEvent !== 'object' || Array.isArray(proposedEvent)) {
    throw new TypeError('proposedEvent must be an object')
  }
  if (typeof proposedEvent.eventId !== 'string' || !proposedEvent.eventId.trim()) {
    throw new TypeError('proposedEvent.eventId is required')
  }

  const canonicalText = canonicalizeEvent(proposedEvent)
  const similaritySearcher = options.similaritySearcher || findSimilarEvents
  const candidateLimit = options.candidateLimit || DEFAULT_CANDIDATE_LIMIT

  const candidates = await similaritySearcher(canonicalText, {
    limit: candidateLimit,
    distanceMeasure: 'COSINE',
  }, options.firestore)

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
