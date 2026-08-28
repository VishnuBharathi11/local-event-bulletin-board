const { getFirestore } = require('../config/firebaseAdmin')
const { generateAndStoreEventEmbedding } = require('../services/eventEmbeddingPipeline')

const EVENTS_COLLECTION = 'events'

function isValidEventDocument(eventId, event) {
  return typeof eventId === 'string' && eventId.trim() && event && typeof event === 'object' && !Array.isArray(event)
}

async function backfillEventEmbeddings(options = {}) {
  const firestore = options.firestore || getFirestore()
  const pipeline = options.generateAndStoreEventEmbedding || generateAndStoreEventEmbedding
  const eventsSnapshot = await firestore.collection(EVENTS_COLLECTION).get()

  const summary = {
    totalEvents: eventsSnapshot.size,
    successfullyEmbedded: 0,
    skipped: 0,
    failed: 0,
  }
  const failures = []
  const skippedEvents = []

  for (const doc of eventsSnapshot.docs) {
    const eventId = doc.id
    const event = doc.data()

    if (!isValidEventDocument(eventId, event)) {
      summary.skipped += 1
      skippedEvents.push({ eventId, reason: 'invalid event document' })
      continue
    }

    try {
      await pipeline({ eventId, ...event }, { firestore })
      summary.successfullyEmbedded += 1
    } catch (error) {
      summary.failed += 1
      failures.push({
        eventId,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { ...summary, failures, skippedEvents }
}

async function main() {
  const summary = await backfillEventEmbeddings()
  console.log(JSON.stringify(summary, null, 2))
  if (summary.failed > 0) process.exitCode = 1
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Embedding backfill failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}

module.exports = { EVENTS_COLLECTION, isValidEventDocument, backfillEventEmbeddings }
