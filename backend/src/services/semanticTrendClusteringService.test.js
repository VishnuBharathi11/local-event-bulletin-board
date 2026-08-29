const test = require('node:test')
const assert = require('node:assert/strict')

const service = require('./semanticTrendClusteringService')
const { EMBEDDING_CONFIG } = require('./eventEmbeddingConfig')

function vectorWith(seed, length = EMBEDDING_CONFIG.dimensions) {
  return Array.from({ length }, (_, index) => index === seed ? 1 : 0)
}

function event(eventId, title, category, city, embedding) {
  return { eventId, title, description: `${title} description`, category, city, neighborhood: 'Central', location: 'Hall', embedding }
}

test('similarity threshold is bounded', () => {
  assert.equal(service.validateSimilarityThreshold(), 0.75)
  assert.equal(service.validateSimilarityThreshold(0), 0)
  assert.equal(service.validateSimilarityThreshold(1), 1)
  assert.throws(() => service.validateSimilarityThreshold(-0.1), /between 0 and 1/)
  assert.throws(() => service.validateSimilarityThreshold(1.1), /between 0 and 1/)
})

test('event limit is bounded', () => {
  assert.equal(service.validateEventLimit(), 20)
  assert.equal(service.validateEventLimit(5), 5)
  assert.throws(() => service.validateEventLimit(0), /between 1 and 200/)
  assert.throws(() => service.validateEventLimit(201), /between 1 and 200/)
})

test('cosine similarity returns a normalized semantic score', () => {
  const a = vectorWith(0, 3)
  const b = vectorWith(0, 3)
  const c = vectorWith(1, 3)
  assert.equal(service.cosineSimilarity(a, b), 1)
  assert.equal(service.cosineSimilarity(a, c), 0)
  assert.equal(service.normalizedSimilarity(1.2), 1)
  assert.equal(service.normalizedSimilarity(-0.2), 0)
})

test('clusterEvents groups semantically similar events into the same cluster', () => {
  const events = [
    event('ai-1', 'Python Workshop', 'Workshops', 'Coimbatore', vectorWith(0)),
    event('ai-2', 'Machine Learning Session', 'Workshops', 'Coimbatore', vectorWith(0)),
    event('sports-1', 'Football Match', 'Sports', 'Coimbatore', vectorWith(1)),
  ]

  const clusters = service.clusterEvents(events, { similarityThreshold: 0.75, limit: 10 })
  assert.equal(clusters.length, 2)
  assert.equal(clusters[0].summary.size, 2)
  assert.deepEqual(clusters[0].events.map((item) => item.eventId).sort(), ['ai-1', 'ai-2'])
  assert.equal(clusters[0].summary.topCategory, 'Workshops')
})

test('clusterEvents excludes incompatible embedding dimensions', () => {
  const events = [
    event('valid-1', 'Music A', 'Music', 'Coimbatore', vectorWith(0)),
    event('invalid-1', 'Music B', 'Music', 'Coimbatore', [0, 1, 0]),
  ]
  const clusters = service.clusterEvents(events)
  assert.equal(clusters.length, 1)
  assert.deepEqual(clusters[0].events.map((item) => item.eventId), ['valid-1'])
})

test('cluster summary is deterministic on tie-breaking', () => {
  const events = [
    event('event-b', 'B Event', 'Music', 'Salem', vectorWith(0)),
    event('event-a', 'A Event', 'Music', 'Coimbatore', vectorWith(0)),
  ]
  const summary = service.summarizeCluster(events, [1])
  assert.deepEqual(summary, {
    size: 2,
    topCategory: 'Music',
    topCity: 'Coimbatore',
    averageSimilarity: 1,
  })
})

test('semantic trend analysis loads embedded events and returns only meaningful clusters', async () => {
  const embeddedEvents = [
    { id: 'event-1', exists: true, data: () => ({ title: 'AI Workshop', description: 'AI', category: 'Workshops', city: 'Coimbatore', neighborhood: 'Central', location: 'Hall', embedding: vectorWith(0) }) },
    { id: 'event-2', exists: true, data: () => ({ title: 'GenAI Meetup', description: 'AI', category: 'Meetups', city: 'Coimbatore', neighborhood: 'Central', location: 'Hall', embedding: vectorWith(0) }) },
    { id: 'event-3', exists: true, data: () => ({ title: 'Football Match', description: 'sports', category: 'Sports', city: 'Coimbatore', neighborhood: 'Central', location: 'Ground', embedding: vectorWith(1) }) },
  ]
  const firestore = {
    collection: () => ({
      limit: () => ({ get: async () => ({ docs: embeddedEvents }) }),
    }),
  }
  const result = await service.analyzeSemanticTrends({ eventLimit: 10, limit: 10, similarityThreshold: 0.75 }, firestore)
  assert.equal(result.version, 'phase5.5-semantic-trends-v1')
  assert.equal(result.input.eventCount, 3)
  assert.equal(result.clusters.length, 1)
  assert.equal(result.clusters[0].summary.size, 2)
  assert.equal(result.skipped.length, 0)
})
