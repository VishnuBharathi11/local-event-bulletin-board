const test = require('node:test')
const assert = require('node:assert/strict')
const { backfillEventEmbeddings, isValidEventDocument } = require('./backfillEventEmbeddings')

test('backfill validates event documents without changing them', () => {
  assert.equal(isValidEventDocument('event-1', { title: 'Music' }), true)
  assert.equal(isValidEventDocument('event-1', null), false)
  assert.equal(isValidEventDocument('', { title: 'Music' }), false)
  assert.equal(isValidEventDocument('event-1', []), false)
})

test('backfill processes valid events and continues after an individual failure', async () => {
  const processed = []
  const firestore = {
    collection: (name) => {
      assert.equal(name, 'events')
      return {
        get: async () => ({
          size: 3,
          docs: [
            { id: 'event-1', data: () => ({ title: 'Music' }) },
            { id: 'event-2', data: () => ({ title: 'Sports' }) },
            { id: 'event-3', data: () => null },
          ],
        }),
      }
    },
  }

  const summary = await backfillEventEmbeddings({
    firestore,
    generateAndStoreEventEmbedding: async (event) => {
      processed.push(event.eventId)
      if (event.eventId === 'event-2') throw new Error('Vertex unavailable')
    },
  })

  assert.deepEqual(processed, ['event-1', 'event-2'])
  assert.deepEqual(summary, {
    totalEvents: 3,
    successfullyEmbedded: 1,
    skipped: 1,
    failed: 1,
    failures: [{ eventId: 'event-2', reason: 'Vertex unavailable' }],
    skippedEvents: [{ eventId: 'event-3', reason: 'invalid event document' }],
  })
})

test('backfill passes Firestore through the existing embedding pipeline', async () => {
  let received
  const firestore = {
    collection: () => ({
      get: async () => ({
        size: 1,
        docs: [{ id: 'event-1', data: () => ({ title: 'Music', city: 'Coimbatore' }) }],
      }),
    }),
  }

  const summary = await backfillEventEmbeddings({
    firestore,
    generateAndStoreEventEmbedding: async (event, options) => {
      received = { event, options }
    },
  })

  assert.equal(summary.successfullyEmbedded, 1)
  assert.deepEqual(received.event, { eventId: 'event-1', title: 'Music', city: 'Coimbatore' })
  assert.equal(received.options.firestore, firestore)
})
