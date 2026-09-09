const semanticEventDiscoveryService = require('./semanticEventDiscoveryService')
const semanticTrendClusteringService = require('./semanticTrendClusteringService')
const semanticConflictAnalyzer = require('./semanticConflictAnalyzer')
const trendService = require('./trendService')

const DEFAULT_SEMANTIC_LIMIT = 5
const MAX_SEMANTIC_LIMIT = 20

function validateSemanticLimit(limit = DEFAULT_SEMANTIC_LIMIT) {
  const value = Number(limit)
  if (!Number.isInteger(value) || value < 1 || value > MAX_SEMANTIC_LIMIT) {
    throw new TypeError(`semantic limit must be an integer between 1 and ${MAX_SEMANTIC_LIMIT}`)
  }
  return value
}

async function semanticEventSearch(query, options = {}) {
  return semanticEventDiscoveryService.searchSemantically(query, {
    ...options,
    limit: validateSemanticLimit(options.limit),
  })
}

async function similarEventsForEvent(event, options = {}) {
  return semanticEventDiscoveryService.findSimilarToEvent(event, {
    ...options,
    limit: validateSemanticLimit(options.limit),
  })
}

async function semanticTrendAnalysis(options = {}) {
  return semanticTrendClusteringService.analyzeSemanticTrends(options, options.firestore)
}

async function deterministicAndSemanticTrends(options = {}) {
  const [deterministic, semantic] = await Promise.all([
    trendService.analyzeTrends(options),
    semanticTrendAnalysis(options),
  ])

  return {
    version: 'phase5.6-unified-intelligence-v1',
    generatedAt: Date.now(),
    deterministic,
    semantic,
  }
}

async function semanticConflictAnalysis(proposedEvent, options = {}) {
  return semanticConflictAnalyzer.detectSemanticConflicts(proposedEvent, options)
}

module.exports = {
  DEFAULT_SEMANTIC_LIMIT,
  MAX_SEMANTIC_LIMIT,
  validateSemanticLimit,
  semanticEventSearch,
  similarEventsForEvent,
  semanticTrendAnalysis,
  deterministicAndSemanticTrends,
  semanticConflictAnalysis,
}
