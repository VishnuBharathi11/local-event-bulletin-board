const test = require('node:test')
const assert = require('node:assert/strict')

const { canonicalizeEvent } = require('./eventCanonicalization')
const {
  EMBEDDING_CONFIG,
  EMBEDDING_MODEL,
  EMBEDDING_TASK_TYPE,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_CONFIG_VERSION,
  validateEmbeddingConfig,
} = require('./eventEmbeddingConfig')
const { validateEmbeddingVector } = require('./embeddingValidator')
const { generateEventEmbedding } = require('./eventEmbeddingService')
const { buildEmbeddingMetadata, saveEventEmbedding } = require('../repositories/eventEmbeddingRepository')
const admin = require('firebase-admin')

const baseEvent = {
  eventId: 'event-123',
  title: 'Community Coding Workshop',
  description: 'Hands-on JavaScript workshop for local developers.',
  category: 'Workshops',
  city: 'Coimbatore',
  neighborhood: 'Gandhipuram',
  location: 'Community Hall',
  organizerId: 'organizer-secret',
  imageUrl: 'https://example.com/signed-image-url',
  startTime: 1770000000000,
  endTime: 1770003600000,
  status: 'PUBLISHED',
  rsvpCount: 42,
  createdAt: 1769000000000,
  expireAt: 1770003600000,
}

test('canonicalization is deterministic', () => {
  const first = canonicalizeEvent(baseEvent)
  const second = canonicalizeEvent({ ...baseEvent, rsvpCount: 999, startTime: 1, updatedAt: 2 })
  assert.equal(first, second)
})

test('canonicalization includes intended semantic fields', () => {
  const text = canonicalizeEvent(baseEvent)
  for (const expected of [
    'Title: Community Coding Workshop',
    'Description: Hands-on JavaScript workshop for local developers.',
    'Category: Workshops',
    'City: Coimbatore',
    'Neighborhood: Gandhipuram',
    'Location: Community Hall',
  ]) assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})

test('canonicalization excludes volatile and internal fields', () => {
  const text = canonicalizeEvent(baseEvent)
  for (const excluded of [
    'event-123',
    'organizer-secret',
    'https://example.com/signed-image-url',
    '42',
    '1770000000000',
    '1770003600000',
    'PUBLISHED',
    '1769000000000',
  ]) {
    assert.equal(text.includes(excluded), false)
  }
})

test('embedding configuration is explicit', () => {
  assert.equal(EMBEDDING_MODEL, 'gemini-embedding-001')
  assert.equal(EMBEDDING_TASK_TYPE, 'RETRIEVAL_DOCUMENT')
  assert.equal(EMBEDDING_DIMENSIONS, 768)
  assert.equal(EMBEDDING_CONFIG_VERSION, 'phase5.1-v1')
  assert.deepEqual(EMBEDDING_CONFIG, {
    model: 'gemini-embedding-001',
    taskType: 'RETRIEVAL_DOCUMENT',
    dimensions: 768,
    configVersion: 'phase5.1-v1',
  })
})

test('invalid dimensionality is rejected', () => {
  assert.throws(() => validateEmbeddingConfig({ dimensions: 2049 }), /between 1 and 2048/)
  assert.throws(() => validateEmbeddingConfig({ dimensions: 0 }), /between 1 and 2048/)
  assert.throws(() => validateEmbeddingConfig({ dimensions: 1.5 }), /between 1 and 2048/)
})

test('empty embedding is rejected', () => {
  assert.throws(() => validateEmbeddingVector([], 768), (error) => error.code === 'EMBEDDING_EMPTY')
  assert.throws(() => validateEmbeddingVector(undefined, 768), (error) => error.code === 'EMBEDDING_EMPTY')
})

test('invalid or non-numeric vector values are rejected', () => {
  assert.throws(() => validateEmbeddingVector([0, Number.NaN], 2), (error) => error.code === 'EMBEDDING_INVALID_VALUE')
  assert.throws(() => validateEmbeddingVector([0, '1'], 2), (error) => error.code === 'EMBEDDING_INVALID_VALUE')
})

test('incorrect vector length is rejected', () => {
  assert.throws(() => validateEmbeddingVector([0, 1], 768), (error) => error.code === 'EMBEDDING_DIMENSION_MISMATCH')
})

test('valid vector passes validation', () => {
  const vector = [0.1, -0.2, 0.3]
  assert.equal(validateEmbeddingVector(vector, 3), vector)
})

test('Vertex embedding call is mocked and receives the configured request', async () => {
  const captured = []
  const fakeAi = {
    models: {
      embedContent: async (request) => {
        captured.push(request)
        return { embeddings: [{ values: [0.1, 0.2, 0.3] }] }
      },
    },
  }

  const result = await generateEventEmbedding('Title: Test event', {
    model: 'gemini-embedding-001',
    taskType: 'RETRIEVAL_DOCUMENT',
    dimensions: 3,
    configVersion: 'test-v1',
  }, fakeAi)

  assert.deepEqual(captured[0], {
    model: 'gemini-embedding-001',
    contents: 'Title: Test event',
    config: { taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: 3 },
  })
  assert.equal(result.embeddingModel, 'gemini-embedding-001')
  assert.equal(result.embeddingDimensions, 3)
  assert.equal(result.embeddingTaskType, 'RETRIEVAL_DOCUMENT')
  assert.equal(result.embeddingConfigVersion, 'test-v1')
})

test('mocked Vertex embedding rejects an empty response', async () => {
  const fakeAi = { models: { embedContent: async () => ({ embeddings: [] }) } }
  await assert.rejects(
    () => generateEventEmbedding('Title: Test event', { ...EMBEDDING_CONFIG, dimensions: 3 }, fakeAi),
    (error) => error.code === 'EMBEDDING_EMPTY',
  )
})

test('mocked Vertex embedding rejects an incorrect vector length', async () => {
  const fakeAi = { models: { embedContent: async () => ({ embeddings: [{ values: [0.1, 0.2] }] }) } }
  await assert.rejects(
    () => generateEventEmbedding('Title: Test event', { ...EMBEDDING_CONFIG, dimensions: 3 }, fakeAi),
    (error) => error.code === 'EMBEDDING_DIMENSION_MISMATCH',
  )
})

test('Firestore metadata preserves existing event fields by using merge', async () => {
  const originalVector = admin.firestore.FieldValue.vector
  const originalServerTimestamp = admin.firestore.FieldValue.serverTimestamp
  admin.firestore.FieldValue.vector = (values) => ({ __vector: values })
  admin.firestore.FieldValue.serverTimestamp = () => ({ __serverTimestamp: true })

  const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, (_, index) => ((index % 17) - 8) / 100)

  try {
    const writes = []
    const existingEvent = { ...baseEvent }
    const firestore = {
      collection: () => ({
        doc: (eventId) => ({
          set: async (data, options) => writes.push({ eventId, data, options }),
        }),
      }),
    }

    const result = await saveEventEmbedding('event-123', {
      vector,
      embeddingModel: EMBEDDING_CONFIG.model,
      embeddingDimensions: EMBEDDING_CONFIG.dimensions,
      embeddingTaskType: EMBEDDING_CONFIG.taskType,
      embeddingConfigVersion: EMBEDDING_CONFIG.configVersion,
    }, firestore)

    assert.deepEqual(Object.keys(result).sort(), [
      'embedding',
      'embeddingConfigVersion',
      'embeddingDimensions',
      'embeddingModel',
      'embeddingTaskType',
      'embeddingUpdatedAt',
    ].sort())
    assert.deepEqual(writes[0].options, { merge: true })
    assert.equal(writes[0].eventId, existingEvent.eventId)
    assert.deepEqual(writes[0].data.embedding.__vector, vector)
    assert.equal(writes[0].data.embeddingModel, 'gemini-embedding-001')
    assert.equal(writes[0].data.embeddingDimensions, 768)
    assert.equal(writes[0].data.embeddingTaskType, 'RETRIEVAL_DOCUMENT')
    assert.equal(writes[0].data.embeddingConfigVersion, 'phase5.1-v1')
    assert.deepEqual(writes[0].data.embeddingUpdatedAt, { __serverTimestamp: true })

    assert.equal(existingEvent.title, 'Community Coding Workshop')
    assert.equal(existingEvent.description, 'Hands-on JavaScript workshop for local developers.')
    assert.equal(existingEvent.category, 'Workshops')
    assert.equal(existingEvent.city, 'Coimbatore')
    assert.equal(existingEvent.neighborhood, 'Gandhipuram')
    assert.equal(existingEvent.location, 'Community Hall')
    assert.equal(existingEvent.rsvpCount, 42)
    assert.equal(existingEvent.organizerId, 'organizer-secret')
    assert.equal(existingEvent.imageUrl, 'https://example.com/signed-image-url')
  } finally {
    admin.firestore.FieldValue.vector = originalVector
    admin.firestore.FieldValue.serverTimestamp = originalServerTimestamp
  }
})

test('existing EventHive model contract remains independent of embedding metadata', () => {
  assert.equal(baseEvent.title, 'Community Coding Workshop')
  assert.equal(baseEvent.category, 'Workshops')
  assert.equal(baseEvent.city, 'Coimbatore')
  assert.equal(baseEvent.neighborhood, 'Gandhipuram')
  assert.equal(baseEvent.location, 'Community Hall')
  assert.equal(baseEvent.rsvpCount, 42)
})
