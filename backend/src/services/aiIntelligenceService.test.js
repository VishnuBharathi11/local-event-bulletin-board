const test = require('node:test')
const assert = require('node:assert/strict')
const service = require('./aiIntelligenceService')

test('semantic limit validation remains bounded', () => {
  assert.equal(service.validateSemanticLimit(), 5)
  assert.equal(service.validateSemanticLimit(20), 20)
  assert.throws(() => service.validateSemanticLimit(0), /between 1 and 20/)
  assert.throws(() => service.validateSemanticLimit(21), /between 1 and 20/)
})

test('unified deterministic and semantic trend service preserves both evidence sources', async () => {
  const originalTrend = require('./trendService').analyzeTrends
  const originalSemantic = require('./semanticTrendClusteringService').analyzeSemanticTrends
  require('./trendService').analyzeTrends = async () => ({ version: 'phase2-test', signals: { eventCount: 3 } })
  require('./semanticTrendClusteringService').analyzeSemanticTrends = async () => ({ version: 'phase5.5-test', clusters: [{ clusterId: 'semantic-1' }] })

  try {
    const result = await service.deterministicAndSemanticTrends({ days: 30 })
    assert.equal(result.version, 'phase5.6-unified-intelligence-v1')
    assert.equal(result.deterministic.version, 'phase2-test')
    assert.equal(result.semantic.version, 'phase5.5-test')
  } finally {
    require('./trendService').analyzeTrends = originalTrend
    require('./semanticTrendClusteringService').analyzeSemanticTrends = originalSemantic
  }
})
