const test = require('node:test')
const assert = require('node:assert/strict')

const service = require('./semanticEventDiscoveryService')

const sampleResults = [
  {
    eventId: 'music-1',
    title: 'Hip Hop Aadhi Concert',
    category: 'Music',
    city: 'Coimbatore',
    distance: 0.08,
    embedding: { secret: true },
    embeddingModel: 'gemini-embedding-001',
    _vectorDistance: 0.08,
  },
  {
    eventId: 'sports-1',
    title: 'Football Match',
    category: 'Sports',
    city: 'Coimbatore',
    distance: 0.25,
  },
]

test('semantic discovery validates a bounded result limit', () => {
  assert.equal(service.validateLimit(), 10)
  assert.equal(service.validateLimit(5), 5)
  assert.throws(() => service.validateLimit(0), /between 1 and 20/)
  assert.throws(() => service.validateLimit(21), /between 1 and 20/)
})

test('semantic query text can be supplied as free text', () => {
  assert.equal(service.buildQueryText('concert or music performance'), 'concert or music performance')
})

test('semantic query text can be built from EventHive semantic fields', () => {
  assert.equal(service.buildQueryText({ category: 'Music', city: 'Coimbatore' }), 'Category: Music\nCity: Coimbatore')
})

test('empty semantic query is rejected', () => {
  assert.throws(() => service.buildQueryText('   '), /semantic query text is required/)
  assert.throws(() => service.buildQueryText({}), /must contain searchable text/)
})

test('deterministic category and city filters narrow semantic candidates', () => {
  assert.deepEqual(
    service.applyDeterministicFilters(sampleResults, { category: 'Music', city: 'Coimbatore' }).map((event) => event.eventId),
    ['music-1'],
  )
})

test('semantic result normalization exposes distance and cosine similarity without embedding metadata', () => {
  assert.deepEqual(service.normalizeResults(sampleResults.slice(0, 1)), [{
    eventId: 'music-1',
    title: 'Hip Hop Aadhi Concert',
    category: 'Music',
    city: 'Coimbatore',
    distance: 0.08,
    semanticSimilarity: 0.92,
  }])
})

test('searchSemantically delegates to Phase 5.2 and preserves deterministic filters', async () => {
  const calls = []
  const fakeSearcher = async (queryText, options, firestore) => {
    calls.push({ queryText, options, firestore })
    return sampleResults
  }

  const fakeFirestore = { marker: true }
  const result = await service.searchSemantically('music event', {
    limit: 5,
    category: 'Music',
    city: 'Coimbatore',
    firestore: fakeFirestore,
  }, { searcher: fakeSearcher })

  assert.deepEqual(calls[0], {
    queryText: 'music event',
    options: { limit: 5, distanceMeasure: 'COSINE' },
    firestore: fakeFirestore,
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].eventId, 'music-1')
  assert.equal(result[0].semanticSimilarity, 0.92)
})

test('findSimilarToEvent canonicalizes the event and removes itself from results', async () => {
  let capturedQuery
  const fakeSearcher = async (queryText) => {
    capturedQuery = queryText
    return [
      { eventId: 'event-123', title: 'same event', distance: 0 },
      { eventId: 'event-456', title: 'related event', distance: 0.12 },
    ]
  }

  const result = await service.findSimilarToEvent({
    eventId: 'event-123',
    title: 'Community Coding Workshop',
    description: 'Coding session',
    category: 'Workshops',
    city: 'Coimbatore',
    neighborhood: 'Gandhipuram',
    location: 'Community Hall',
  }, {}, { searcher: fakeSearcher })

  assert.match(capturedQuery, /Title: Community Coding Workshop/)
  assert.match(capturedQuery, /Category: Workshops/)
  assert.deepEqual(result, [{
    eventId: 'event-456',
    title: 'related event',
    distance: 0.12,
    semanticSimilarity: 0.88,
  }])
})
