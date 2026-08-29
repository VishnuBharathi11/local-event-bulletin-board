const test = require('node:test')
const assert = require('node:assert/strict')
const chatbotService = require('./chatbotService')
const { classifyIntent, extractCurrentFilters, extractFilters, resolveEffectiveFilters, sanitizeEvidenceForResponse, isRsvpQuestion, executeTool, INTENTS } = require('./orchestrationService')

test('current explicit filters override prior conversation filters', () => {
  assert.deepEqual(resolveEffectiveFilters('Show Sports events in Salem', [{ role: 'user', content: 'Show Music events in Coimbatore' }]), { category: 'Sports', city: 'Salem' })
})

test('missing city inherits from relevant event context', () => {
  assert.deepEqual(resolveEffectiveFilters('Upcoming events in Music', [{ role: 'user', content: 'Show me Music events in Coimbatore' }]), { category: 'Music', city: 'Coimbatore' })
})

test('missing category inherits while an explicit category replaces old context', () => {
  assert.deepEqual(resolveEffectiveFilters('Upcoming events in Coimbatore', [{ role: 'user', content: 'Show me Music events in Coimbatore' }]), { category: 'Music', city: 'Coimbatore' })
  assert.deepEqual(resolveEffectiveFilters('What about Music?', [{ role: 'user', content: 'Show me events in Coimbatore' }]), { category: 'Music', city: 'Coimbatore' })
  assert.deepEqual(resolveEffectiveFilters('What about Sports?', [{ role: 'user', content: 'Show Music events' }]), { category: 'Sports' })
})

test('unrelated community intent does not inherit event filters', () => {
  const message = 'What does the community want?'
  assert.equal(classifyIntent(message), INTENTS.COMMUNITY_DEMAND)
  assert.deepEqual(resolveEffectiveFilters(message, [{ role: 'user', content: 'Show me events in Coimbatore' }]), {})
})

test('current discovery request is independent after a previous trend request', () => {
  assert.deepEqual(resolveEffectiveFilters('Show me Music events in Coimbatore', [{ role: 'user', content: 'What events are trending in Salem?' }]), { category: 'Music', city: 'Coimbatore' })
  assert.deepEqual(resolveEffectiveFilters('Upcoming events', [{ role: 'user', content: 'What Music events are trending in Coimbatore?' }]), {})
})

test('category-vs-city extraction recognizes supported categories before generic location extraction', () => {
  assert.deepEqual(extractCurrentFilters('Upcoming events in Music'), { category: 'Music' })
  assert.deepEqual(extractCurrentFilters('Show Music events in Coimbatore'), { category: 'Music', city: 'Coimbatore' })
  assert.deepEqual(extractCurrentFilters('Show Sports events in Salem this weekend'), { category: 'Sports', city: 'Salem', timeRange: 'weekend' })
})

test('filter helpers omit undefined properties', () => {
  assert.deepEqual(extractFilters('Show Sports events in Salem'), { category: 'Sports', city: 'Salem' })
  assert.deepEqual(extractFilters('Show Music events this weekend'), { category: 'Music', timeRange: 'weekend' })
  assert.deepEqual(extractFilters('Upcoming events'), {})
})

test('extractFilters remains compatible with the existing orchestration contract', () => {
  assert.deepEqual(extractFilters('Show Music events in Coimbatore this weekend'), { category: 'Music', city: 'Coimbatore', timeRange: 'weekend' })
})

test('mandatory Music plus Coimbatore request reaches getUpcomingEvents with effective filters', async () => {
  const original = chatbotService.getUpcomingEvents
  let received
  chatbotService.getUpcomingEvents = async (args) => {
    received = args
    return [{ eventId: 'event-12345678', title: 'Hip Hop Aadhi Concert', category: 'Music', city: 'Coimbatore', startTime: Date.now() + 86400000 }]
  }
  try {
    const filters = resolveEffectiveFilters('Upcoming events in Music', [{ role: 'user', content: 'Show me Music events in Coimbatore' }])
    const toolData = await executeTool(INTENTS.EVENT_DISCOVERY, filters, 'Upcoming events in Music')
    assert.deepEqual(received, { category: 'Music', city: 'Coimbatore', limit: 20 })
    assert.deepEqual(toolData.result.map((event) => event.title), ['Hip Hop Aadhi Concert'])
  } finally {
    chatbotService.getUpcomingEvents = original
  }
})

test('mandatory Sports plus Salem request replaces Music plus Coimbatore context', () => {
  assert.deepEqual(resolveEffectiveFilters('Show me Sports events in Salem', [{ role: 'user', content: 'Show me Music events in Coimbatore' }]), { category: 'Sports', city: 'Salem' })
})

test('ordinary discovery evidence hides RSVP counts', () => {
  const event = { eventId: 'event-12345678', title: 'Hip Hop Aadhi Concert', category: 'Music', city: 'Coimbatore', rsvpCount: 4 }
  const publicEvidence = sanitizeEvidenceForResponse([event], INTENTS.EVENT_DISCOVERY, 'Show me Music events in Coimbatore')
  assert.equal(publicEvidence[0].rsvpCount, undefined)
  assert.equal(event.rsvpCount, 4)
})

test('explicit RSVP questions retain verified RSVP counts', () => {
  assert.equal(isRsvpQuestion("How many people RSVP'd?"), true)
  assert.equal(isRsvpQuestion('Show me Music events'), false)
  assert.equal(sanitizeEvidenceForResponse([{ title: 'Hip Hop Aadhi Concert', rsvpCount: 4 }], INTENTS.EVENT_DISCOVERY, "How many people RSVP'd?")[0].rsvpCount, 4)
})

test('empty event results remain empty evidence', () => {
  assert.deepEqual(sanitizeEvidenceForResponse([], INTENTS.EVENT_DISCOVERY, 'Show Music events'), [])
})
