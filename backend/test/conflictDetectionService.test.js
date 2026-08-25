const test = require('node:test')
const assert = require('node:assert/strict')
const { calculateConflict, detectConflicts, titleSimilarity, CONFLICT_THRESHOLD } = require('../src/services/conflictDetectionService')

function event(overrides = {}) {
  return {
    eventId: '',
    title: 'Community Music Workshop',
    description: 'A local event',
    category: 'Music',
    city: 'Coimbatore',
    neighborhood: 'RS Puram',
    location: 'Community Hall',
    startTime: 1000,
    endTime: 2000,
    status: 'PUBLISHED',
    rsvpCount: 0,
    organizerId: 'dev_user',
    createdAt: 1,
    expireAt: 2000,
    conflictStatus: 'NONE',
    ...overrides,
  }
}

test('uses the Kotlin conflict threshold of 70', () => assert.equal(CONFLICT_THRESHOLD, 70))

test('strong conflict reaches 100', () => {
  const conflict = calculateConflict(event(), event({ eventId: 'existing' }))
  assert.equal(conflict.conflictScore, 100)
})

test('same city and overlap alone is a weak 45-point conflict', () => {
  const conflict = calculateConflict(event({ title: 'New Event', category: 'Food', neighborhood: 'Different', location: 'Different' }), event({ eventId: 'existing', title: 'Old Event', category: 'Sports' }))
  assert.equal(conflict.conflictScore, 45)
})

test('different city removes location points but overlap remains', () => {
  const conflict = calculateConflict(event({ city: 'Erode', title: 'Unique A', category: 'Food' }), event({ eventId: 'existing', city: 'Coimbatore', title: 'Unique B', category: 'Sports' }))
  assert.equal(conflict.conflictScore, 30)
  assert.equal(conflict.reasons.includes('Same city'), false)
})

test('different category removes category score', () => {
  const conflict = calculateConflict(event({ category: 'Food', title: 'Unique A' }), event({ eventId: 'existing', category: 'Sports', title: 'Unique B' }))
  assert.equal(conflict.conflictScore, 45)
})

test('time boundary is non-overlapping when end equals start', () => {
  const conflict = calculateConflict(event({ startTime: 2000, endTime: 3000 }), event({ eventId: 'existing', startTime: 1000, endTime: 2000 }))
  assert.equal(conflict.reasons.includes('Time overlaps with existing event'), false)
})

test('title similarity uses Jaccard token similarity with Kotlin stop words', () => {
  assert.equal(titleSimilarity('A Music Festival', 'The Music Festival'), 1)
})

test('title score is included only when rounded score is greater than 5', () => {
  const conflict = calculateConflict(event({ title: 'Music Workshop' }), event({ eventId: 'existing', title: 'Music Workshop Today', category: 'Food', city: 'Other', neighborhood: 'Other', location: 'Other', startTime: 3000, endTime: 4000 }))
  assert.equal(conflict.conflictScore, 13)
  assert.equal(conflict.reasons.includes('Event title appears similar'), true)
})

test('expired existing events are still candidates because Kotlin does not filter them', () => {
  const conflict = calculateConflict(event(), event({ eventId: 'expired', expireAt: 500, startTime: 1000, endTime: 2000 }))
  assert.equal(conflict.conflictScore, 100)
})

test('self event is excluded from candidate results', () => {
  const conflicts = detectConflicts(event({ eventId: 'same' }), [event({ eventId: 'same' })])
  assert.deepEqual(conflicts, [])
})

test('multiple conflicts are sorted by descending score', () => {
  const conflicts = detectConflicts(event({ eventId: 'new' }), [
    event({ eventId: 'weak', title: 'Other', category: 'Food' }),
    event({ eventId: 'strong' }),
  ])
  assert.deepEqual(conflicts.map((item) => item.conflictingEventId), ['strong'])
})
