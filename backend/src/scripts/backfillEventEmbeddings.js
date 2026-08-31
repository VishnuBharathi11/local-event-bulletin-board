const { getFirestore } = require('../config/firebaseAdmin')
const { canonicalizeEvent } = require('../services/eventCanonicalization')
const { generateEventEmbedding } = require('../services/eventEmbeddingService')
const { saveEventEmbedding } = require('../repositories/eventRepository')
const { fromFirestoreDocument } = require('../models/eventModel')

async function main() {
  const snapshot = await getFirestore().collection('events').get()
  let processed = 0
  let skipped = 0

  for (const document of snapshot.docs) {
    const data = document.data()
    if (data.embedding) {
      skipped += 1
      continue
    }

    const event = fromFirestoreDocument(document)
    if (!event) continue

    const embedding = await generateEventEmbedding(canonicalizeEvent(event))
    await saveEventEmbedding(document.id, embedding)
    processed += 1
    console.log(`Embedded event ${document.id}`)
  }

  console.log(`Embedding backfill complete: ${processed} created, ${skipped} already present.`)
}

main().catch((error) => {
  console.error('Embedding backfill failed:', error)
  process.exitCode = 1
})
