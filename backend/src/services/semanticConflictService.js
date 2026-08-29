const { calculateConflict, CONFLICT_THRESHOLD } = require('./conflictDetectionService')

const DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD = Number(process.env.SEMANTIC_CONFLICT_SIMILARITY_THRESHOLD || 0.75)
const MAX_SEMANTIC_SCORE = 20

function validateSimilarityThreshold(threshold = DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD) {
  const value = Number(threshold)
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeError('semantic similarity threshold must be between 0 and 1')
  }
  return value
}

function cosineDistanceToSimilarity(distance) {
  const value = Number(distance)
  if (!Number.isFinite(value)) return null
  return Math.max(0, Math.min(1, 1 - value))
}

function semanticScore(similarity, threshold = DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD) {
  const normalizedThreshold = validateSimilarityThreshold(threshold)
  if (similarity === null || !Number.isFinite(Number(similarity))) return 0
  const value = Math.max(0, Math.min(1, Number(similarity)))
  if (value < normalizedThreshold) return 0
  const range = Math.max(0.000001, 1 - normalizedThreshold)
  return Math.min(MAX_SEMANTIC_SCORE, Math.round(((value - normalizedThreshold) / range) * MAX_SEMANTIC_SCORE))
}

function enrichConflictWithSemanticEvidence(deterministicConflict, semanticDistance, options = {}) {
  if (!deterministicConflict || typeof deterministicConflict !== 'object') {
    throw new TypeError('deterministic conflict is required')
  }

  const similarity = cosineDistanceToSimilarity(semanticDistance)
  const threshold = validateSimilarityThreshold(options.threshold)
  const additionalScore = semanticScore(similarity, threshold)
  const reasons = Array.isArray(deterministicConflict.reasons)
    ? [...deterministicConflict.reasons]
    : []

  if (similarity !== null && similarity >= threshold) {
    const percentage = Math.round(similarity * 100)
    reasons.push(`Semantic similarity: ${percentage}%`)
  }

  return {
    ...deterministicConflict,
    conflictScore: Math.min(100, deterministicConflict.conflictScore + additionalScore),
    semanticSimilarity: similarity,
    semanticDistance: Number.isFinite(Number(semanticDistance)) ? Number(semanticDistance) : null,
    semanticScore: additionalScore,
    semanticThreshold: threshold,
    reasons,
    semanticEvidence: similarity !== null && similarity >= threshold,
    deterministicConflictScore: deterministicConflict.conflictScore,
    conflictThreshold: CONFLICT_THRESHOLD,
  }
}

function classifySemanticConflict(enrichedConflict) {
  if (!enrichedConflict || typeof enrichedConflict !== 'object') {
    throw new TypeError('enriched conflict is required')
  }

  return enrichedConflict.conflictScore >= CONFLICT_THRESHOLD
    ? 'POTENTIAL_CONFLICT'
    : 'NO_DETERMINISTIC_CONFLICT'
}

function buildSemanticConflictResult(proposedEvent, existingEvent, semanticDistance, options = {}) {
  const deterministicConflict = calculateConflict(proposedEvent, existingEvent)
  const enriched = enrichConflictWithSemanticEvidence(deterministicConflict, semanticDistance, options)

  return {
    ...enriched,
    semanticDecision: classifySemanticConflict(enriched),
  }
}

module.exports = {
  DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD,
  MAX_SEMANTIC_SCORE,
  validateSimilarityThreshold,
  cosineDistanceToSimilarity,
  semanticScore,
  enrichConflictWithSemanticEvidence,
  classifySemanticConflict,
  buildSemanticConflictResult,
}
