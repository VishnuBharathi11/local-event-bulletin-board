const test = require('node:test')
const assert = require('node:assert/strict')

const {
  calculateConflict,
  detectConflicts,
  CONFLICT_THRESHOLD,
} = require('./conflictDetectionService')

function createEvent(overrides = {}) {
  return {
    eventId: '',
    title: 'Python Workshop',
    description: 'A local community workshop',
    category: 'Workshops',
    city: 'Coimbatore',
    neighborhood: 'Sundarapuram',
    location: 'Sundarapuram, Sundarapuram, Coimbatore, Tamil Nadu 641024, India',
    startTime: 1000,
    endTime: 2000,
    status: 'PUBLISHED',
    rsvpCount: 0,
    organizerId: 'organizer-1',
    createdAt: 1,
    expireAt: 2000,
    conflictStatus: 'NONE',
    imageUrl: '',
    ...overrides,
  }
}

test('same venue and overlapping time is a hard scheduling conflict even for different categories', () => {
  const proposed = createEvent({
    eventId: 'new-event',
    title: 'Python Workshop',
    category: 'Workshops',
  })

  const existing = createEvent({
    eventId: 'existing-event',
    title: 'Hip Hop Concert',
    category: 'Music',
  })

  const conflict = calculateConflict(proposed, existing)

  assert.equal(conflict.isHardConflict, true)
  assert.equal(conflict.conflictType, 'HARD_SCHEDULING_CONFLICT')
  assert.match(
    conflict.reasons.join(' | '),
    /Same venue has an overlapping event/
  )

  // The normal scoring model remains unchanged.
  assert.ok(conflict.conflictScore < CONFLICT_THRESHOLD)

  const conflicts = detectConflicts(proposed, [existing])

  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].conflictingEventId, 'existing-event')
  assert.equal(conflicts[0].isHardConflict, true)
})

test('same venue without overlapping time is not a hard scheduling conflict', () => {
  const proposed = createEvent({
    eventId: 'new-event',
    startTime: 3000,
    endTime: 4000,
  })

  const existing = createEvent({
    eventId: 'existing-event',
    startTime: 1000,
    endTime: 2000,
  })

  const conflict = calculateConflict(proposed, existing)

  assert.equal(conflict.isHardConflict, false)
})

test('different venues with overlapping time are not hard venue conflicts', () => {
  const proposed = createEvent({
    eventId: 'new-event',
    location: 'Community Hall, Coimbatore',
  })

  const existing = createEvent({
    eventId: 'existing-event',
    location: 'City Auditorium, Coimbatore',
  })

  const conflict = calculateConflict(proposed, existing)

  assert.equal(conflict.isHardConflict, false)
})