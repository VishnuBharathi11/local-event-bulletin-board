const test = require('node:test')
const assert = require('node:assert/strict')
const orchestration = require('./orchestrationService')
const chatbotService = require('./chatbotService')
const eventRepository = require('../repositories/eventRepository')
const geminiService = require('./geminiService')
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

test('explicit temporal event request clears stale category and city context', () => {
  const state = { intent: orchestration.INTENTS.EVENT_DISCOVERY, category: 'Music', city: 'Coimbatore' }
  assert.deepEqual(orchestration.extractFilters('Events tomorrow'), { timeRange: 'tomorrow' })
  assert.deepEqual(orchestration.resolveEffectiveFilters('Events tomorrow', [], orchestration.INTENTS.EVENT_DISCOVERY, state), {
    timeRange: 'tomorrow',
  })
})

test('what-about Sports still inherits the prior city while replacing category', () => {
  const state = { intent: orchestration.INTENTS.EVENT_DISCOVERY, category: 'Music', city: 'Coimbatore' }
  assert.deepEqual(orchestration.resolveEffectiveFilters('What about Sports?', [], orchestration.INTENTS.EVENT_DISCOVERY, state), {
    category: 'Sports',
    city: 'Coimbatore',
  })
})

test('event detail questions resolve to EVENT_DETAILS', () => {
  assert.equal(orchestration.classifyIntent('When is the Football Match?'), orchestration.INTENTS.EVENT_DETAILS)
  assert.equal(orchestration.classifyIntent('Show me the Football Match details'), orchestration.INTENTS.EVENT_DETAILS)
  assert.equal(orchestration.classifyIntent('Tell me about the Football Match'), orchestration.INTENTS.EVENT_DETAILS)
  assert.equal(orchestration.classifyIntent('When does the Football Match start?'), orchestration.INTENTS.EVENT_DETAILS)
  assert.equal(orchestration.classifyIntent('Where is the Football Match?'), orchestration.INTENTS.EVENT_DETAILS)
  assert.equal(orchestration.classifyIntent('Tell me more about the Football Match'), orchestration.INTENTS.EVENT_DETAILS)
})

test('natural event detail resolution uses the unique active event title', async () => {
  const originalGetActiveEvents = eventRepository.getActiveEvents
  const originalGetEventDetails = chatbotService.getEventDetails
  let requestedId = null
  const storedEvent = {
    eventId: 'football-123',
    title: 'Football Match',
    description: 'Community football match',
    category: 'Sports',
    city: 'Coimbatore',
    location: 'VOC Park',
    startTime: Date.parse('2026-08-30T18:30:00+05:30'),
    endTime: Date.parse('2026-08-30T20:30:00+05:30'),
  }
  eventRepository.getActiveEvents = async () => [storedEvent]
  chatbotService.getEventDetails = async (eventId) => {
    requestedId = eventId
    return storedEvent
  }
  try {
    const result = await orchestration.executeTool(orchestration.INTENTS.EVENT_DETAILS, {}, 'When is the Football Match?')
    assert.equal(result.tool, 'getEventDetails')
    assert.equal(requestedId, 'football-123')
    assert.equal(result.arguments.eventId, 'football-123')
    assert.equal(result.result.title, 'Football Match')
  } finally {
    eventRepository.getActiveEvents = originalGetActiveEvents
    chatbotService.getEventDetails = originalGetEventDetails
  }
})

test('event detail response is deterministic and contains stored fields only', () => {
  const response = orchestration.buildDeterministicEventDetailResponse({
    title: 'Football Match',
    description: 'Community football match',
    category: 'Sports',
    location: 'VOC Park',
    neighborhood: 'Race Course',
    city: 'Coimbatore',
    startTime: Date.parse('2026-08-30T18:30:00+05:30'),
    endTime: Date.parse('2026-08-30T20:30:00+05:30'),
  })
  assert.match(response, /Football Match/)
  assert.match(response, /Community football match/)
  assert.match(response, /Sports/)
  assert.match(response, /VOC Park/)
  assert.match(response, /Coimbatore/)
  assert.match(response, /Aug 30, 2026|30 Aug 2026/i)
  assert.match(response, /6:30\s*(AM|PM|am|pm)|18:30/)
  assert.doesNotMatch(response, /\[Insert Date|\[Insert Start Time|\[Insert Venue|\[Insert Surface|\[e\.g\.|\$10 per player/i)
})

test('ongoing event discovery resolves to the ongoing time range', () => {
  assert.equal(orchestration.classifyIntent('What are the ongoing events?'), orchestration.INTENTS.EVENT_DISCOVERY)
  assert.deepEqual(orchestration.extractFilters('What are the ongoing events?'), { timeRange: 'ongoing' })
})

test('ongoing filter uses startTime <= now < endTime', async () => {
  const originalNow = Date.now
  const originalGetActiveEvents = eventRepository.getActiveEvents
  const now = Date.parse('2026-08-29T18:00:00+05:30')
  Date.now = () => now
  eventRepository.getActiveEvents = async () => [
    { eventId: 'starts-now', title: 'Starts Now', startTime: now, endTime: now + 3600000 },
    { eventId: 'ending-now', title: 'Ends Now', startTime: now - 3600000, endTime: now },
    { eventId: 'future', title: 'Future', startTime: now + 3600000, endTime: now + 7200000 },
    { eventId: 'expired', title: 'Expired', startTime: now - 7200000, endTime: now - 3600000 },
  ]
  try {
    const result = await orchestration.executeTool(orchestration.INTENTS.EVENT_DISCOVERY, { timeRange: 'ongoing' }, 'What are the ongoing events?')
    assert.equal(result.tool, 'getUpcomingEvents')
    assert.deepEqual(result.result.map((event) => event.eventId), ['starts-now'])
  } finally {
    Date.now = originalNow
    eventRepository.getActiveEvents = originalGetActiveEvents
  }
})

test('upcoming semantics use the existing startTime > now and expiration rules', async () => {
  const originalNow = Date.now
  const originalGetActiveEvents = eventRepository.getActiveEvents
  const now = Date.parse('2026-08-29T18:00:00+05:30')

  Date.now = () => now

  eventRepository.getActiveEvents = async () => [
    {
      eventId: 'future',
      title: 'Future',
      startTime: now + 3600000,
      endTime: now + 7200000,
      expireAt: now + 7200000,
    },
    {
      eventId: 'starts-now',
      title: 'Starts Now',
      startTime: now,
      endTime: now + 3600000,
      expireAt: now + 3600000,
    },
  ]

  try {
    const result = await chatbotService.getUpcomingEvents({ limit: 20 })

    assert.deepEqual(
      result.map((event) => event.eventId),
      ['future']
    )
  } finally {
    Date.now = originalNow
    eventRepository.getActiveEvents = originalGetActiveEvents
  }
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
  assert.match(response, /6:30\s*(AM|PM|am|pm)|18:30/)
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
