const test = require('node:test')
const assert = require('node:assert/strict')
const orchestration = require('./orchestrationService')
const chatbotService = require('./chatbotService')
const geminiService = require('./geminiService')
const conversationContext = require('./conversationContext')

test('natural event-existence questions remain deterministic category discovery', () => {
  assert.equal(orchestration.classifyIntent('Is there any events in Food'), orchestration.INTENTS.EVENT_DISCOVERY)
  assert.equal(orchestration.classifyIntent('Is there event in Music'), orchestration.INTENTS.EVENT_DISCOVERY)
  assert.deepEqual(orchestration.extractFilters('Is there any events in Food'), { category: 'Food' })
  assert.deepEqual(orchestration.extractFilters('Is there event in Music'), { category: 'Music' })
})

test('correction phrase keeps the explicit category and remains discovery-oriented', () => {
  assert.equal(orchestration.classifyIntent('But there is event in music'), orchestration.INTENTS.EVENT_DISCOVERY)
  assert.deepEqual(orchestration.extractFilters('But there is event in music'), { category: 'Music' })
})

test('explicit Sports category remains authoritative for what-about follow-up', () => {
  const state = { intent: orchestration.INTENTS.EVENT_DISCOVERY, category: 'Music', city: 'Coimbatore' }
  assert.deepEqual(orchestration.extractFilters('What about Sports?'), { category: 'Sports' })
  assert.deepEqual(orchestration.resolveEffectiveFilters('What about Sports?', [], orchestration.INTENTS.EVENT_DISCOVERY, state), { category: 'Sports', city: 'Coimbatore' })
})

test('deterministic trend request is not contaminated by stale event context', () => {
  const state = { intent: orchestration.INTENTS.EVENT_DISCOVERY, category: 'Music', city: 'Coimbatore' }
  assert.equal(orchestration.classifyIntent('What are the trending events?'), orchestration.INTENTS.TREND_ANALYSIS)
  assert.deepEqual(orchestration.resolveEffectiveFilters('What are the trending events?', [], orchestration.INTENTS.TREND_ANALYSIS, state), {})
})

test('tomorrow event list resolves deterministically to tomorrow', () => {
  assert.equal(orchestration.classifyIntent('List the tomorrow events'), orchestration.INTENTS.EVENT_DISCOVERY)
  assert.deepEqual(orchestration.extractFilters('List the tomorrow events'), { timeRange: 'tomorrow' })
  const range = orchestration.resolveDateRange('tomorrow', new Date('2026-08-29T10:00:00+05:30'))
  assert.equal(new Date(range.startTime).getDate(), 30)
})

test('event result context retains the actual displayed result count', () => {
  const state = {
    intent: orchestration.INTENTS.EVENT_DISCOVERY,
    tool: 'getUpcomingEvents',
    resultMetadata: [
      { eventId: 'e1', title: 'Football Match', category: 'Sports', city: 'Coimbatore' },
      { eventId: 'e2', title: 'Music Night', category: 'Music', city: 'Coimbatore' },
    ],
  }
  assert.deepEqual(orchestration.resolveContextualIntent('Over all events displayed', state), { intent: orchestration.INTENTS.EVENT_COUNT_SUMMARY })
  assert.equal(orchestration.getDisplayedEventCount(state), 2)
})

test('community demand resolution remains isolated and tool-grounded', () => {
  assert.equal(orchestration.classifyIntent('What does the community want?'), orchestration.INTENTS.COMMUNITY_DEMAND)
  assert.deepEqual(orchestration.resolveEffectiveFilters('What does the community want?', [{ role: 'user', content: 'Show me Music events in Coimbatore' }], orchestration.INTENTS.COMMUNITY_DEMAND), {})
})

test('community demand Gemini evidence is passed through without fabricated event fields', async () => {
  const originalDemand = chatbotService.getCommunityDemand
  const originalClient = geminiService.getClient
  let capturedEvidence = ''
  chatbotService.getCommunityDemand = async () => [{ requestId: 'req-1', title: 'Book Club', city: 'Coimbatore', demandCount: 4 }]
  geminiService.getClient = () => ({ models: { generateContent: async ({ contents }) => { capturedEvidence = contents; return { text: 'The community is requesting a Book Club in Coimbatore.' } } } })
  try {
    const result = await orchestration.orchestrate({ message: 'What does the community want?', conversationId: `community-test-${Date.now()}` })
    assert.equal(result.intent, orchestration.INTENTS.COMMUNITY_DEMAND)
    assert.equal(result.tool, 'getCommunityDemand')
    assert.match(capturedEvidence, /Book Club/)
    assert.doesNotMatch(capturedEvidence, /invented-event/)
  } finally {
    chatbotService.getCommunityDemand = originalDemand
    geminiService.getClient = originalClient
  }
})

// Keep this regression file self-contained; cleanup is intentionally limited to public context helpers.
test('conversation context remains within established limits', () => {
  assert.equal(conversationContext.MAX_HISTORY_TURNS, 8)
  assert.equal(conversationContext.MAX_HISTORY_ITEM_CHARS, 1500)
  assert.equal(conversationContext.MAX_TOTAL_CONTEXT_CHARS, 6000)
  assert.equal(conversationContext.MAX_MESSAGE_CHARS, 1000)
})
