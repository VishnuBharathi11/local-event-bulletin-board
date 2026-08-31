const test = require('node:test')
const assert = require('node:assert/strict')

const { checkConflicts, mergeConflicts } = require('./conflictService')

const existingEvent = {
  eventId: 'existing-event',
  title: 'TTE TED Talk',
  description: 'A local TED-style talk and discussion.',
  category: 'Workshops',
  city: 'Coimbatore',
  neighborhood: 'Kootathippatti',
  location: 'Karapaga Vinayagar Temple',
  startTime: 1770000000000,
  endTime: 1770000600000,
  status: 'PUBLISHED',
  rsvpCount: 0,
  organizerId: 'organizer-1',
  createdAt: 1770000000000,
  expireAt: 1770000600000,
}

const proposedEvent = {
  eventId: '',
  title: 'A2D Meetup!',
  description: 'A meetup about A2D.',
  category: 'Meetups',
  city: 'Coimbatore',
  neighborhood: 'Kootathippatti',
  location: 'Karapaga Vinayagar Temple',
  startTime: 1770000000000,
  endTime: 1770000900000,
  status: 'PUBLISHED',
  rsvpCount: 0,
  organizerId: 'organizer-2',
  createdAt: 1770000000000,
  expireAt: 1770000900000,
}

test('event conflict checks merge semantic evidence into the existing deterministic conflict', async () => {
  const semanticCalls = []

  const conflicts = await checkConflicts(proposedEvent, {
    existingEvents: [existingEvent],
    similaritySearcher: async (canonicalText, options) => {
      semanticCalls.push({ canonicalText, options })
      return [{ ...existingEvent, distance: 0.05 }]
    },
  })

  assert.equal(semanticCalls.length, 1)
  assert.match(semanticCalls[0].canonicalText, /Title: A2D Meetup!/) 
  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].conflictingEventId, 'existing-event')
  assert.equal(conflicts[0].deterministicConflictScore, 60)
  assert.equal(conflicts[0].semanticSimilarity, 0.95)
  assert.ok(conflicts[0].semanticScore > 0)
  assert.ok(conflicts[0].conflictScore >= 70)
  assert.ok(conflicts[0].semanticEvidence)
  assert.match(conflicts[0].reasons.join(' | '), /Semantic similarity:/)
})

test('semantic conflicts do not create duplicates for an existing deterministic conflict', async () => {
  const deterministic = [{ conflictingEventId: 'existing-event', conflictScore: 80, reasons: ['deterministic'] }]
  const semantic = [{ conflictingEventId: 'existing-event', conflictScore: 90, reasons: ['semantic'] }]

  const merged = mergeConflicts(deterministic, semantic)

  assert.equal(merged.length, 1)
  assert.equal(merged[0].conflictScore, 90)
})

test('semantic similarity does not bypass the deterministic conflict threshold', async () => {
  const differentTimeEvent = {
    ...existingEvent,
    startTime: 1770100000000,
    endTime: 1770100600000,
  }

  const conflicts = await checkConflicts(proposedEvent, {
    existingEvents: [differentTimeEvent],
    similaritySearcher: async () => [{ ...differentTimeEvent, distance: 0.01 }],
  })

  assert.equal(conflicts.length, 0)
})
