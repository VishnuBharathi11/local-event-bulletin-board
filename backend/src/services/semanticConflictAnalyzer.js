const { canonicalizeEvent } = require('./eventCanonicalization')
const { findSimilarEvents } = require('./semanticSimilarityService')
const { buildSemanticConflictResult } = require('./semanticConflictService')

const DEFAULT_CANDIDATE_LIMIT = 20

function stripEmbeddingMetadata(event = {}) {
  const { embedding, embeddingModel, embeddingDimensions, embeddingTaskType, embeddingConfigVersion, embeddingUpdatedAt, ...publicEvent } = event
  return publicEvent
}

function hasConflictSignal(conflict) {
  // A hard scheduling collision is authoritative even when its
  // deterministic score is below the general potential-conflict threshold.
  return Boolean(conflict.isHardConflict) ||
    conflict.conflictScore >= conflict.conflictThreshold
}

async function detectSemanticConflicts(proposedEvent, options = {}) {
  if (!proposedEvent || typeof proposedEvent !== 'object' || Array.isArray(proposedEvent)) {
    throw new TypeError('proposedEvent must be an object')
  }

  const canonicalText = canonicalizeEvent(proposedEvent)
  const similaritySearcher = options.similaritySearcher || findSimilarEvents
  const candidateLimit = options.candidateLimit || DEFAULT_CANDIDATE_LIMIT
  const proposedEventId = typeof proposedEvent.eventId === 'string' ? proposedEvent.eventId.trim() : ''

  const candidates = await similaritySearcher(canonicalText, {
    limit: candidateLimit,
    distanceMeasure: 'COSINE',
  }, options.firestore)

  const results = candidates
    .filter((candidate) => !proposedEventId || candidate.eventId !== proposedEventId)
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
