const test = require('node:test')
const assert = require('node:assert/strict')

const { calculateConflict, CONFLICT_THRESHOLD } = require('./conflictDetectionService')
const {
  DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD,
  MAX_SEMANTIC_SCORE,
  validateSimilarityThreshold,
  cosineDistanceToSimilarity,
  semanticScore,
  enrichConflictWithSemanticEvidence,
  classifySemanticConflict,
  buildSemanticConflictResult,
} = require('./semanticConflictService')

const baseEvent = {
  eventId: 'new-event',
  title: 'Python Workshop for Beginners',
  description: 'Hands-on Python programming workshop.',
  category: 'Workshops',
  city: 'Coimbatore',
  neighborhood: 'Gandhipuram',
  location: 'Community Hall',
  startTime: 1770000000000,
  endTime: 1770003600000,
}

const existingEvent = {
  eventId: 'existing-event',
  title: 'Introduction to Python Programming',
  description: 'Beginner Python coding workshop for local developers.',
  category: 'Workshops',
  city: 'Coimbatore',
  neighborhood: 'Gandhipuram',
  location: 'Community Hall',
  startTime: 1770001800000,
  endTime: 1770005400000,
}

test('semantic similarity threshold defaults are bounded', () => {
  assert.equal(DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD, 0.75)
  assert.equal(MAX_SEMANTIC_SCORE, 20)
  assert.equal(validateSimilarityThreshold(0), 0)
  assert.equal(validateSimilarityThreshold(1), 1)
  assert.throws(() => validateSimilarityThreshold(-0.1), /between 0 and 1/)
  assert.throws(() => validateSimilarityThreshold(1.1), /between 0 and 1/)
})

test('cosine distance is converted into bounded similarity', () => {
  assert.equal(cosineDistanceToSimilarity(0), 1)
  assert.equal(cosineDistanceToSimilarity(0.25), 0.75)
  assert.equal(cosineDistanceToSimilarity(1), 0)
  assert.equal(cosineDistanceToSimilarity('invalid'), null)
})

test('semantic score is only added at or above the configured threshold', () => {
  assert.equal(semanticScore(0.74, 0.75), 0)
  assert.ok(semanticScore(0.9, 0.75) > 0)
  assert.equal(semanticScore(1, 0.75), MAX_SEMANTIC_SCORE)
})

test('semantic evidence enriches deterministic conflict without replacing it', () => {
  const deterministic = calculateConflict(baseEvent, existingEvent)
  const enriched = enrichConflictWithSemanticEvidence(deterministic, 0.1, { threshold: 0.75 })

  assert.equal(enriched.deterministicConflictScore, deterministic.conflictScore)
  assert.equal(enriched.semanticDistance, 0.1)
  assert.equal(enriched.semanticSimilarity, 0.9)
  assert.equal(enriched.semanticEvidence, true)
  assert.ok(enriched.semanticScore > 0)
  assert.equal(enriched.conflictScore, deterministic.conflictScore + enriched.semanticScore)
  assert.equal(enriched.conflictThreshold, CONFLICT_THRESHOLD)
  assert.match(enriched.reasons.at(-1), /Semantic similarity: 90%/)
})

test('low semantic similarity contributes no semantic score', () => {
  const deterministic = calculateConflict(baseEvent, existingEvent)
  const enriched = enrichConflictWithSemanticEvidence(deterministic, 0.4, { threshold: 0.75 })

  assert.equal(enriched.semanticSimilarity, 0.6)
  assert.equal(enriched.semanticEvidence, false)
  assert.equal(enriched.semanticScore, 0)
  assert.equal(enriched.conflictScore, deterministic.conflictScore)
})

test('semantic conflict classification remains compatible with deterministic threshold', () => {
  const deterministic = calculateConflict(baseEvent, existingEvent)
  const enriched = enrichConflictWithSemanticEvidence(deterministic, 0.05)
  const classification = classifySemanticConflict(enriched)

  assert.equal(classification, enriched.conflictScore >= CONFLICT_THRESHOLD ? 'POTENTIAL_CONFLICT' : 'NO_DETERMINISTIC_CONFLICT')
})

test('combined semantic conflict result contains semantic and deterministic evidence', () => {
  const result = buildSemanticConflictResult(baseEvent, existingEvent, 0.1)

  assert.equal(result.eventId, 'new-event')
  assert.equal(result.conflictingEventId, 'existing-event')
  assert.equal(result.semanticDistance, 0.1)
  assert.equal(result.semanticSimilarity, 0.9)
  assert.equal(result.semanticEvidence, true)
  assert.equal(result.semanticDecision, 'POTENTIAL_CONFLICT')
  assert.ok(Array.isArray(result.reasons))
})
