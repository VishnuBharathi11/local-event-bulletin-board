const test = require('node:test')
const assert = require('node:assert/strict')
const service = require('./orchestrationService')

test('semantic discovery intent routes semantic event search', () => {
  assert.equal(service.classifyIntent('Find events related to football for students'), service.INTENTS.SEMANTIC_EVENT_DISCOVERY)
})

test('semantic trend intent routes semantic trend analysis', () => {
  assert.equal(service.classifyIntent('What semantic trends are emerging?'), service.INTENTS.SEMANTIC_TREND_ANALYSIS)
})

test('similar-event intent routes similar event discovery', () => {
  assert.equal(service.classifyIntent('Find similar events to event: abcdefgh'), service.INTENTS.SIMILAR_EVENT_DISCOVERY)
})

test('executeTool delegates semantic discovery to the unified intelligence service', async () => {
  const original = require('./chatbotService').semanticEventSearch
  let captured
  require('./chatbotService').semanticEventSearch = async (query, options) => {
    captured = { query, options }
    return [{ eventId: 'event-1', title: 'Football Workshop', distance: 0.1, semanticSimilarity: 0.9 }]
  }
  try {
    const result = await service.executeTool(service.INTENTS.SEMANTIC_EVENT_DISCOVERY, { city: 'Coimbatore' }, 'Find events related to football')
    assert.equal(result.tool, 'semanticEventSearch')
    assert.equal(captured.query, 'Find events related to football')
    assert.equal(captured.options.city, 'Coimbatore')
    assert.equal(result.result[0].semanticSimilarity, 0.9)
  } finally {
    require('./chatbotService').semanticEventSearch = original
  }
})

test('semantic trend tool remains read-only and delegated', async () => {
  const original = require('./chatbotService').semanticTrendAnalysis
  require('./chatbotService').semanticTrendAnalysis = async () => ({ clusters: [{ clusterId: 'semantic-1', summary: { size: 2 } }] })
  try {
    const result = await service.executeTool(service.INTENTS.SEMANTIC_TREND_ANALYSIS, {}, 'What semantic trends are emerging?')
    assert.equal(result.tool, 'semanticTrendAnalysis')
    assert.equal(result.result.clusters[0].summary.size, 2)
  } finally {
    require('./chatbotService').semanticTrendAnalysis = original
  }
})
