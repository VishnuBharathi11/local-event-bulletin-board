const test = require('node:test')
const assert = require('node:assert/strict')
const admin = require('firebase-admin')
const {
  DEFAULT_DISTANCE_MEASURE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  validateLimit,
  validateDistanceMeasure,
  findSimilarEventsByVector,
  findSimilarEvents,
} = require('./semanticSimilarityService')
const { EMBEDDING_CONFIG } = require('./eventEmbeddingConfig')

test('semantic similarity defaults are explicit', () => {
  assert.equal(DEFAULT_DISTANCE_MEASURE, 'COSINE')
  assert.equal(DEFAULT_LIMIT, 10)
  assert.equal(MAX_LIMIT, 20)
})

test('similarity limit validation is bounded', () => {
  assert.equal(validateLimit(), 10)
  assert.equal(validateLimit(5), 5)
  assert.throws(() => validateLimit(0), /between 1 and 20/)
  assert.throws(() => validateLimit(21), /between 1 and 20/)
  assert.throws(() => validateLimit(1.5), /between 1 and 20/)
})

test('distance measure validation accepts supported Firestore measures', () => {
  assert.equal(validateDistanceMeasure(), 'COSINE')
  assert.equal(validateDistanceMeasure('cosine'), 'COSINE')
  assert.equal(validateDistanceMeasure('EUCLIDEAN'), 'EUCLIDEAN')
  assert.equal(validateDistanceMeasure('dot_product'), 'DOT_PRODUCT')
  assert.throws(() => validateDistanceMeasure('MANHATTAN'), /COSINE, EUCLIDEAN, or DOT_PRODUCT/)
})

test('vector search uses the existing events embedding field and configured dimensions', async () => {
  const originalVector = admin.firestore.FieldValue.vector
  admin.firestore.FieldValue.vector = (values) => ({ __vector: values })

  try {
    const vector = Array.from({ length: EMBEDDING_CONFIG.dimensions }, (_, index) => index / 1000)
    const calls = []
    const docs = [
      {
        id: 'event-1',
        data: () => ({ title: 'Music event', embeddingModel: EMBEDDING_CONFIG.model }),
        get: (field) => field === '_vectorDistance' ? 0.08 : undefined,
      },
    ]
    const firestore = {
      collection: (name) => {
        assert.equal(name, 'events')
        return {
          findNearest: (field, queryVector, options) => {
            calls.push({ field, queryVector, options })
            return { get: async () => ({ docs }) }
          },
        }
      },
    }

    const results = await findSimilarEventsByVector(vector, { limit: 5, distanceMeasure: 'cosine' }, firestore)

    assert.equal(calls.length, 1)
    assert.equal(calls[0].field, 'embedding')
    assert.deepEqual(calls[0].queryVector.__vector, vector)
    assert.deepEqual(calls[0].options, {
      limit: 5,
      distanceMeasure: 'COSINE',
      distanceResultField: '_vectorDistance',
    })
    assert.deepEqual(results, [{
      eventId: 'event-1',
      title: 'Music event',
      embeddingModel: EMBEDDING_CONFIG.model,
      distance: 0.08,
    }])
  } finally {
    admin.firestore.FieldValue.vector = originalVector
  }
})

test('similarity query generates a query embedding before vector search', async () => {
  const vector = Array.from({ length: EMBEDDING_CONFIG.dimensions }, (_, index) => index / 1000)
  const embeddingCalls = []
  const fakeEmbeddingGenerator = async (canonicalText, config) => {
    embeddingCalls.push({ canonicalText, config })
    return {
      vector,
      embeddingModel: config.model,
      embeddingDimensions: config.dimensions,
      embeddingTaskType: 'RETRIEVAL_QUERY',
      embeddingConfigVersion: config.configVersion,
    }
  }
  const originalVector = admin.firestore.FieldValue.vector
  admin.firestore.FieldValue.vector = (values) => ({ __vector: values })

  try {
    const firestore = {
      collection: () => ({
        findNearest: (field, queryVector) => ({
          get: async () => ({ docs: [{ id: 'event-1', data: () => ({ title: 'Music event' }), get: () => 0.1 }] }),
        }),
      }),
    }
    const results = await findSimilarEvents('Title: Music event', { limit: 1 }, firestore, fakeEmbeddingGenerator)

    assert.equal(embeddingCalls.length, 1)
    assert.equal(embeddingCalls[0].canonicalText, 'Title: Music event')
    assert.equal(embeddingCalls[0].config.model, 'gemini-embedding-001')
    assert.equal(embeddingCalls[0].config.dimensions, 768)
    assert.deepEqual(results[0], { eventId: 'event-1', title: 'Music event', distance: 0.1 })
  } finally {
    admin.firestore.FieldValue.vector = originalVector
  }
})

test('semantic similarity does not change event documents', async () => {
  const vector = Array.from({ length: EMBEDDING_CONFIG.dimensions }, () => 0.01)
  const writes = []
  const firestore = {
    collection: () => ({
      findNearest: () => ({
        get: async () => ({ docs: [] }),
      }),
      doc: () => ({
        set: async (...args) => writes.push(args),
      }),
    }),
  }
  const originalVector = admin.firestore.FieldValue.vector
  admin.firestore.FieldValue.vector = (values) => ({ __vector: values })

  try {
    await findSimilarEventsByVector(vector, {}, firestore)
    assert.equal(writes.length, 0)
  } finally {
    admin.firestore.FieldValue.vector = originalVector
  }
})
