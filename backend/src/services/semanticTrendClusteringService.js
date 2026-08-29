const { getFirestore } = require('../config/firebaseAdmin')
const { EMBEDDING_CONFIG } = require('./eventEmbeddingConfig')
const { fromFirestoreDocument } = require('../models/eventModel')

const EVENTS_COLLECTION = 'events'
const DEFAULT_LIMIT = 20
const MAX_EVENTS = 200
const DEFAULT_SIMILARITY_THRESHOLD = 0.75

function validateSimilarityThreshold(value = DEFAULT_SIMILARITY_THRESHOLD) {
  const threshold = Number(value)
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new TypeError('similarity threshold must be between 0 and 1')
  }
  return threshold
}

function validateEventLimit(value = DEFAULT_LIMIT) {
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_EVENTS) {
    throw new TypeError(`event limit must be an integer between 1 and ${MAX_EVENTS}`)
  }
  return limit
}

function extractEmbedding(event) {
  const embedding = event?.embedding
  if (Array.isArray(embedding)) return embedding
  if (embedding && Array.isArray(embedding.value)) return embedding.value
  if (embedding && Array.isArray(embedding.values)) return embedding.values
  return null
}

function cosineSimilarity(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB) || vectorA.length !== vectorB.length || vectorA.length === 0) return null
  let dot = 0
  let magnitudeA = 0
  let magnitudeB = 0
  for (let index = 0; index < vectorA.length; index += 1) {
    const a = Number(vectorA[index])
    const b = Number(vectorB[index])
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null
    dot += a * b
    magnitudeA += a * a
    magnitudeB += b * b
  }
  if (magnitudeA === 0 || magnitudeB === 0) return null
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
}

function normalizedSimilarity(similarity) {
  return similarity === null || !Number.isFinite(Number(similarity)) ? null : Math.max(0, Math.min(1, Number(similarity)))
}

function buildClusterId(seedEventId) {
  return `semantic-${seedEventId}`
}

function summarizeCluster(events, similarities = []) {
  const categoryCounts = new Map()
  const cityCounts = new Map()
  for (const event of events) {
    categoryCounts.set(event.category, (categoryCounts.get(event.category) || 0) + 1)
    cityCounts.set(event.city, (cityCounts.get(event.city) || 0) + 1)
  }
  const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null
  const topCity = [...cityCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null
  const numericSimilarities = similarities.filter((value) => Number.isFinite(value))
  const averageSimilarity = numericSimilarities.length
    ? Number((numericSimilarities.reduce((sum, value) => sum + value, 0) / numericSimilarities.length).toFixed(4))
    : null
  return { size: events.length, topCategory, topCity, averageSimilarity }
}

function clusterEvents(events, options = {}) {
  const threshold = validateSimilarityThreshold(options.similarityThreshold)
  const maxClusters = validateEventLimit(options.limit || DEFAULT_LIMIT)
  const remaining = new Map(events.filter((event) => extractEmbedding(event)?.length === EMBEDDING_CONFIG.dimensions).map((event) => [event.eventId, event]))
  const clusters = []

  while (remaining.size > 0 && clusters.length < maxClusters) {
    const seed = remaining.values().next().value
    remaining.delete(seed.eventId)
    const members = [seed]
    const similarities = []
    const seedVector = extractEmbedding(seed)

    for (const [eventId, candidate] of [...remaining.entries()]) {
      const similarity = normalizedSimilarity(cosineSimilarity(seedVector, extractEmbedding(candidate)))
      if (similarity !== null && similarity >= threshold) {
        members.push(candidate)
        similarities.push(similarity)
        remaining.delete(eventId)
      }
    }

    clusters.push({
      clusterId: buildClusterId(seed.eventId),
      label: seed.title,
      events: members.map(({ embedding, ...event }) => event),
      summary: summarizeCluster(members, similarities),
    })
  }

  return clusters.sort((a, b) => b.summary.size - a.summary.size || b.summary.averageSimilarity - a.summary.averageSimilarity || a.clusterId.localeCompare(b.clusterId))
}

async function loadEmbeddedEvents(firestore = getFirestore(), limit = MAX_EVENTS) {
  const safeLimit = validateEventLimit(limit)
  const snapshot = await firestore.collection(EVENTS_COLLECTION).limit(safeLimit).get()
  const events = []
  const skipped = []
  for (const doc of snapshot.docs) {
    const raw = doc.data()
    let event
    try {
      event = fromFirestoreDocument(doc)
    } catch (_) {
      skipped.push({ eventId: doc.id, reason: 'invalid event document' })
      continue
    }
    if (!event) continue
    const vector = extractEmbedding(raw)
    if (!Array.isArray(vector) || vector.length !== EMBEDDING_CONFIG.dimensions) {
      skipped.push({ eventId: doc.id, reason: 'embedding missing or incompatible' })
      continue
    }
    events.push({ ...event, embedding: vector })
  }
  return { events, skipped }
}

async function analyzeSemanticTrends(options = {}, firestore = getFirestore()) {
  const limit = validateEventLimit(options.eventLimit || MAX_EVENTS)
  const resultLimit = validateEventLimit(options.limit || DEFAULT_LIMIT)
  const threshold = validateSimilarityThreshold(options.similarityThreshold)
  const { events, skipped } = await loadEmbeddedEvents(firestore, limit)
  const clusters = clusterEvents(events, { similarityThreshold: threshold, limit: resultLimit })
  const meaningfulClusters = clusters.filter((cluster) => cluster.summary.size >= 2)

  return {
    version: 'phase5.5-semantic-trends-v1',
    generatedAt: Date.now(),
    configuration: {
      embeddingModel: EMBEDDING_CONFIG.model,
      embeddingDimensions: EMBEDDING_CONFIG.dimensions,
      similarityThreshold: threshold,
    },
    input: { eventCount: events.length, skippedCount: skipped.length },
    clusters: meaningfulClusters,
    skipped,
  }
}

module.exports = {
  EVENTS_COLLECTION,
  DEFAULT_LIMIT,
  MAX_EVENTS,
  DEFAULT_SIMILARITY_THRESHOLD,
  validateSimilarityThreshold,
  validateEventLimit,
  extractEmbedding,
  cosineSimilarity,
  normalizedSimilarity,
  buildClusterId,
  summarizeCluster,
  clusterEvents,
  loadEmbeddedEvents,
  analyzeSemanticTrends,
}
