const test = require('node:test')
const assert = require('node:assert/strict')
const orchestration = require('./orchestrationService')
const chatbotService = require('./chatbotService')
const geminiService = require('./geminiService')
const conversationContext = require('./conversationContext')

test('general conversation phrases are classified separately from EventHive tools', () => {
  for (const phrase of ['Hi', 'Hello', 'Good morning', 'Good evening', 'Thanks', 'Thank you', 'Who are you?']) {
    assert.equal(orchestration.classifyIntent(phrase), orchestration.INTENTS.GENERAL_CONVERSATION)
  }
})

test('direct and semantic EventHive intents remain distinct', () => {
  assert.equal(orchestration.classifyIntent('Show me Music events in Coimbatore'), orchestration.INTENTS.EVENT_DISCOVERY)
  assert.equal(orchestration.classifyIntent('Find events related to football'), orchestration.INTENTS.SEMANTIC_EVENT_DISCOVERY)
  assert.equal(orchestration.classifyIntent('What semantic trends are emerging?'), orchestration.INTENTS.SEMANTIC_TREND_ANALYSIS)
  assert.equal(orchestration.classifyIntent('Find similar events to event: abcdefgh'), orchestration.INTENTS.SIMILAR_EVENT_DISCOVERY)
  assert.equal(orchestration.classifyIntent('Tell me more about this event'), orchestration.INTENTS.EVENT_DETAILS)
})

test('temporal phrases resolve consistently to deterministic filters', () => {
  for (const phrase of [
    "Tomorrow events",
    'Events tomorrow',
    "What's happening tomorrow?",
    "Show me tomorrow's events",
    'Give me tomorrow events list',
    'What events are happening tomorrow?',
  ]) assert.equal(orchestration.extractFilters(phrase).timeRange, 'tomorrow')
  assert.equal(orchestration.extractFilters('Events this weekend').timeRange, 'weekend')
  assert.equal(orchestration.extractFilters('Events next week').timeRange, 'next_week')
})

test('short event follow-ups resolve against a unique prior event', () => {
  const state = {
    intent: orchestration.INTENTS.EVENT_DISCOVERY,
    eventId: 'football-1',
    eventTitle: 'Football Match',
    category: 'Sports',
    city: 'Coimbatore',
    resultMetadata: [{ eventId: 'football-1', title: 'Football Match', category: 'Sports', city: 'Coimbatore' }],
  }
  assert.deepEqual(orchestration.resolveContextualIntent('When?', state), { intent: orchestration.INTENTS.EVENT_DETAILS, eventId: 'football-1' })
  assert.deepEqual(orchestration.resolveContextualIntent('Where?', state), { intent: orchestration.INTENTS.EVENT_DETAILS, eventId: 'football-1' })
  assert.deepEqual(orchestration.resolveContextualIntent('Who?', state), { intent: orchestration.INTENTS.EVENT_DETAILS, eventId: 'football-1' })
  assert.deepEqual(orchestration.resolveContextualIntent('Football Match', state), { intent: orchestration.INTENTS.EVENT_DETAILS, eventId: 'football-1' })
})

test('category-only trend follow-up uses the previous trend context', () => {
  assert.deepEqual(
    orchestration.resolveContextualIntent('Workshops', { intent: orchestration.INTENTS.TREND_ANALYSIS }),
    { intent: orchestration.INTENTS.TREND_ANALYSIS },
  )
})

test('explicit new event request takes precedence over stored event context', () => {
  const state = { intent: orchestration.INTENTS.EVENT_DETAILS, eventId: 'football-1', eventTitle: 'Football Match', city: 'Coimbatore' }
  assert.equal(orchestration.resolveContextualIntent('Show me Music events in Coimbatore', state), null)
  assert.deepEqual(
    orchestration.resolveEffectiveFilters('Show me Music events in Coimbatore', [], orchestration.INTENTS.EVENT_DISCOVERY, state),
    { category: 'Music', city: 'Coimbatore' },
  )
})

test('greeting never invokes an EventHive tool and returns a deterministic fallback when Gemini is unavailable', async () => {
  const originalIsConfigured = geminiService.isConfigured
  const originalUpcoming = chatbotService.getUpcomingEvents
  let called = false
  const conversationId = `greeting-test-${Date.now()}`
  geminiService.isConfigured = () => false
  chatbotService.getUpcomingEvents = async () => { called = true; return [] }
  try {
    const result = await orchestration.orchestrate({ message: 'Good evening', conversationId })
    assert.equal(result.intent, orchestration.INTENTS.GENERAL_CONVERSATION)
    assert.equal(result.tool, null)
    assert.equal(result.grounded, false)
    assert.match(result.response, /EventHive Assistant/)
    assert.equal(called, false)
  } finally {
    geminiService.isConfigured = originalIsConfigured
    chatbotService.getUpcomingEvents = originalUpcoming
    conversationContext.clearConversationContext(conversationId)
  }
})

test('conversation memory is bounded and non-sensitive', () => {
  const conversationId = `memory-test-${Date.now()}`
  conversationContext.rememberConversationContext(conversationId, {
    intent: orchestration.INTENTS.EVENT_DISCOVERY,
    tool: 'getUpcomingEvents',
    eventId: 'football-1',
    eventTitle: 'Football Match',
    category: 'Sports',
    city: 'Coimbatore',
    query: 'Show Sports events in Coimbatore',
    resultMetadata: Array.from({ length: 20 }, (_, index) => ({ eventId: `event-${index}`, title: `Event ${index}`, category: 'Sports', city: 'Coimbatore' })),
  })
  try {
    const stored = conversationContext.getConversationContext(conversationId)
    assert.equal(stored.resultMetadata.length, 10)
    assert.equal(stored.eventId, 'football-1')
    assert.equal(stored.query, 'Show Sports events in Coimbatore')
    assert.equal(Object.prototype.hasOwnProperty.call(stored, 'password'), false)
  } finally {
    conversationContext.clearConversationContext(conversationId)
  }
})
