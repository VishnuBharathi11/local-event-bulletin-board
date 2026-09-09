const test = require('node:test')
const assert = require('node:assert/strict')

const { detectSemanticConflicts, stripEmbeddingMetadata, hasConflictSignal } = require('./semanticConflictAnalyzer')
const { CONFLICT_THRESHOLD } = require('./conflictDetectionService')

const proposedEvent = {
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

const candidateEvent = {
  eventId: 'existing-event',
  title: 'Introduction to Python Programming',
  description: 'Beginner Python coding workshop for local developers.',
  category: 'Workshops',
  city: 'Coimbatore',
  neighborhood: 'Gandhipuram',
  location: 'Community Hall',
  startTime: 1770001800000,
  endTime: 1770005400000,
  embedding: { secret: true },
  embeddingModel: 'gemini-embedding-001',
  embeddingDimensions: 768,
  embeddingTaskType: 'RETRIEVAL_DOCUMENT',
  embeddingConfigVersion: 'phase5.1-v1',
  embeddingUpdatedAt: 'timestamp',
}

test('semantic conflict analyzer uses canonical event text and KNN candidates', async () => {
  const calls = []
  const results = await detectSemanticConflicts(proposedEvent, {
    candidateLimit: 5,
    similaritySearcher: async (canonicalText, options) => {
      calls.push({ canonicalText, options })
      return [candidateEvent]
    },
  })

  assert.equal(calls.length, 1)
  assert.match(calls[0].canonicalText, /Title: Python Workshop for Beginners/)
  assert.equal(calls[0].options.limit, 5)
  assert.equal(calls[0].options.distanceMeasure, 'COSINE')
  assert.equal(results.length, 1)
  assert.equal(results[0].conflictingEventId, 'existing-event')
})

test('semantic evidence strengthens deterministic conflict scoring', async () => {
  const results = await detectSemanticConflicts(proposedEvent, {
    similaritySearcher: async () => [
      { ...candidateEvent, distance: 0.05 },
    ],
  })

  assert.equal(results.length, 1)
  assert.equal(results[0].semanticSimilarity, 0.95)
  assert.ok(results[0].semanticScore > 0)
  assert.ok(results[0].conflictScore >= results[0].deterministicConflictScore)
  assert.equal(results[0].conflictThreshold, CONFLICT_THRESHOLD)
  assert.equal(results[0].semanticDecision, 'POTENTIAL_CONFLICT')
})

test('semantic similarity alone cannot bypass the deterministic conflict threshold', async () => {
  const differentTimeEvent = {
    ...candidateEvent,
    startTime: 1770100000000,
    endTime: 1770103600000,
  }

  const results = await detectSemanticConflicts(proposedEvent, {
    similaritySearcher: async () => [
      { ...differentTimeEvent, distance: 0.01 },
    ],
  })

  assert.equal(results.length, 0)
})

test('candidate embedding metadata is stripped from returned event details', () => {
  const stripped = stripEmbeddingMetadata(candidateEvent)
  assert.equal(stripped.embedding, undefined)
  assert.equal(stripped.embeddingModel, undefined)
  assert.equal(stripped.embeddingDimensions, undefined)
  assert.equal(stripped.title, candidateEvent.title)
  assert.equal(stripped.location, candidateEvent.location)
})

test('conflict signal follows deterministic threshold after semantic enrichment', () => {
  assert.equal(hasConflictSignal({ conflictScore: CONFLICT_THRESHOLD, conflictThreshold: CONFLICT_THRESHOLD }), true)
  assert.equal(hasConflictSignal({ conflictScore: CONFLICT_THRESHOLD - 1, conflictThreshold: CONFLICT_THRESHOLD }), false)
})
