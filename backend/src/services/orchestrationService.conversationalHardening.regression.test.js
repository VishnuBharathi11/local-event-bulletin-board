const test = require('node:test')
const assert = require('node:assert/strict')
const orchestration = require('./orchestrationService')
const chatbotService = require('./chatbotService')
const conversationContext = require('./conversationContext')

test('event-existence questions resolve to deterministic category discovery', () => {
  for (const [message, category] of [
    ['Is there any events in Food', 'Food'],
    ['Is there event in Music', 'Music'],
  ]) {
    assert.equal(orchestration.classifyIntent(message), orchestration.INTENTS.EVENT_DISCOVERY)
    assert.deepEqual(orchestration.extractFilters(message), { category })
  }
})

test('correction phrase re-enters deterministic Music discovery', () => {
  const message = 'But there is event in music'
  assert.equal(orchestration.classifyIntent(message), orchestration.INTENTS.EVENT_DISCOVERY)
  assert.deepEqual(orchestration.extractFilters(message), { category: 'Music' })
})

test('what-about category keeps explicit Sports and inherits only missing city context', () => {
  const state = { intent: orchestration.INTENTS.EVENT_DISCOVERY, category: 'Music', city: 'Coimbatore' }
  assert.deepEqual(orchestration.extractFilters('What about Sports?'), { category: 'Sports' })
  assert.deepEqual(orchestration.resolveEffectiveFilters('What about Sports?', [], orchestration.INTENTS.EVENT_DISCOVERY, state), {
    category: 'Sports',
    city: 'Coimbatore',
  })
})

test('trending request ignores stale event filters', () => {
  const state = { intent: orchestration.INTENTS.EVENT_DISCOVERY, category: 'Music', city: 'Coimbatore' }
  assert.equal(orchestration.classifyIntent('What are the trending events?'), orchestration.INTENTS.TREND_ANALYSIS)
  assert.deepEqual(orchestration.resolveEffectiveFilters('What are the trending events?', [], orchestration.INTENTS.TREND_ANALYSIS, state), {})
})

test('what-about Sports after trend analysis remains a trend follow-up', () => {
  const state = { intent: orchestration.INTENTS.TREND_ANALYSIS }
  assert.deepEqual(orchestration.resolveContextualIntent('What about Sports?', state), { intent: orchestration.INTENTS.TREND_ANALYSIS })
  assert.deepEqual(orchestration.resolveEffectiveFilters('What about Sports?', [], orchestration.INTENTS.TREND_ANALYSIS, state), { category: 'Sports' })
})

test('tomorrow event-list response contains a complete deterministic date and time', () => {
  assert.equal(orchestration.classifyIntent('List the tomorrow events'), orchestration.INTENTS.EVENT_DISCOVERY)
  assert.deepEqual(orchestration.extractFilters('List the tomorrow events'), { timeRange: 'tomorrow' })
  const response = orchestration.buildTemporalEventResponse([
    { eventId: 'e1', title: 'Football Match', city: 'Coimbatore', startTime: Date.parse('2026-08-30T18:30:00+05:30') },
  ], { timeRange: 'tomorrow' })
  assert.match(response, /Football Match/)
  assert.match(response, /Aug 30, 2026|30 Aug 2026/i)
  assert.match(response, /6:30 PM|18:30/)
  assert.doesNotMatch(response, /\b\d{1,2}:$/)
})

test('event-count follow-up reports the exact stored displayed result count', () => {
  const state = {
    intent: orchestration.INTENTS.EVENT_DISCOVERY,
    tool: 'getUpcomingEvents',
    resultCount: 14,
    resultMetadata: Array.from({ length: 10 }, (_, index) => ({ eventId: `event-${index}`, title: `Event ${index}` })),
  }
  assert.deepEqual(orchestration.resolveContextualIntent('Over all events displayed', state), { intent: orchestration.INTENTS.EVENT_COUNT_SUMMARY })
  assert.equal(orchestration.getDisplayedEventCount(state), 14)
})

test('community demand response is limited to verified tool fields', async () => {
  const originalDemand = chatbotService.getCommunityDemand
  chatbotService.getCommunityDemand = async () => [{ requestId: 'req-1', title: 'Book Club', city: 'Coimbatore', category: 'Community', demandCount: 4 }]
  try {
    const result = await orchestration.executeTool(orchestration.INTENTS.COMMUNITY_DEMAND, {}, 'What does the community want?')
    assert.equal(result.tool, 'getCommunityDemand')
    assert.deepEqual(result.result, [{ requestId: 'req-1', title: 'Book Club', city: 'Coimbatore', category: 'Community', demandCount: 4 }])
    const response = orchestration.buildCommunityDemandResponse(result.result)
    assert.match(response, /Book Club/)
    assert.match(response, /Community/)
    assert.match(response, /Coimbatore/)
    assert.match(response, /4 interested/)
    assert.doesNotMatch(response, /invented|unknown event/i)
  } finally {
    chatbotService.getCommunityDemand = originalDemand
  }
})

test('deterministic Music discovery receives the corrected category and city', async () => {
  const original = chatbotService.getUpcomingEvents
  let captured
  chatbotService.getUpcomingEvents = async (args) => {
    captured = args
    return [{ eventId: 'music-1', title: 'Music Night', category: 'Music', city: 'Coimbatore', startTime: Date.now() + 3600000 }]
  }
  try {
    const result = await orchestration.executeTool(orchestration.INTENTS.EVENT_DISCOVERY, { category: 'Music', city: 'Coimbatore' }, 'But there is event in music')
    assert.equal(result.tool, 'getUpcomingEvents')
    assert.equal(captured.category, 'Music')
    assert.equal(captured.city, 'Coimbatore')
    assert.equal(result.result[0].title, 'Music Night')
  } finally {
    chatbotService.getUpcomingEvents = original
  }
})

test('conversation context remains within established Phase 4.3 limits', () => {
  assert.equal(conversationContext.MAX_HISTORY_TURNS, 8)
  assert.equal(conversationContext.MAX_HISTORY_ITEM_CHARS, 1500)
  assert.equal(conversationContext.MAX_TOTAL_CONTEXT_CHARS, 6000)
  assert.equal(conversationContext.MAX_MESSAGE_CHARS, 1000)
})
