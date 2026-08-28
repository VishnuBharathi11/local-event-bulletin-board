const test = require('node:test')
const assert = require('node:assert/strict')
const {
  classifyIntent,
  extractCurrentFilters,
  resolveEffectiveFilters,
  sanitizeEvidenceForResponse,
  isRsvpQuestion,
  INTENTS,
} = require('./orchestrationService')

test('current explicit filters override prior conversation filters', () => {
  const history = [{ role: 'user', content: 'Show Music events in Coimbatore' }]
  assert.deepEqual(resolveEffectiveFilters('Show Sports events in Salem', history), { category: 'Sports', city: 'Salem' })
})

test('missing city inherits from relevant event-discovery context', () => {
  const history = [{ role: 'user', content: 'Show me Music events in Coimbatore' }]
  assert.deepEqual(resolveEffectiveFilters('Upcoming events in Music', history), { category: 'Music', city: 'Coimbatore' })
})

test('missing category inherits while explicit current category replaces context', () => {
  const history = [{ role: 'user', content: 'Show me events in Coimbatore' }]
  assert.deepEqual(resolveEffectiveFilters('What about Music?', history), { category: 'Music', city: 'Coimbatore' })

  const musicHistory = [{ role: 'user', content: 'Show Music events' }]
  assert.deepEqual(resolveEffectiveFilters('What about Sports?', musicHistory), { category: 'Sports' })
})

test('unrelated community intent does not inherit event filters', () => {
  const history = [{ role: 'user', content: 'Show me events in Coimbatore' }]
  assert.equal(classifyIntent('What does the community want?'), INTENTS.COMMUNITY_DEMAND)
  assert.deepEqual(resolveEffectiveFilters('What does the community want?', history), {})
})

test('current event discovery is resolved independently after a previous trend request', () => {
  const history = [{ role: 'user', content: 'What events are trending?' }]
  assert.deepEqual(resolveEffectiveFilters('Show me Music events in Coimbatore', history), { category: 'Music', city: 'Coimbatore' })
})

test('ordinary discovery evidence hides RSVP counts while retaining internal evidence', () => {
  const event = { eventId: 'event-12345678', title: 'Hip Hop Aadhi Concert', category: 'Music', city: 'Coimbatore', rsvpCount: 4 }
  const publicEvidence = sanitizeEvidenceForResponse([event], INTENTS.EVENT_DISCOVERY, 'Show me Music events in Coimbatore')
  assert.equal(publicEvidence[0].rsvpCount, undefined)
  assert.equal(event.rsvpCount, 4)
})

test('explicit RSVP questions allow verified RSVP evidence', () => {
  assert.equal(isRsvpQuestion("How many people RSVP'd?"), true)
  assert.equal(isRsvpQuestion('Show me Music events'), false)
  const event = { title: 'Hip Hop Aadhi Concert', rsvpCount: 4 }
  assert.equal(sanitizeEvidenceForResponse([event], INTENTS.EVENT_DISCOVERY, "How many people RSVP'd?")[0].rsvpCount, 4)
})

test('empty and non-empty result evidence remains distinguishable', () => {
  assert.deepEqual(sanitizeEvidenceForResponse([], INTENTS.EVENT_DISCOVERY, 'Show Music events'), [])
  assert.deepEqual(sanitizeEvidenceForResponse([{ title: 'Hip Hop Aadhi Concert', rsvpCount: 4 }], INTENTS.EVENT_DISCOVERY, 'Show Music events'), [{ title: 'Hip Hop Aadhi Concert' }])
})
