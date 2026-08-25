const test = require('node:test')
const assert = require('node:assert/strict')
const {
  calculateConflict,
  detectConflicts,
  titleSimilarity,
  CONFLICT_THRESHOLD,
} = require('../src/services/conflictDetectionService')
const {
  ACTIVITY_SIMILARITY_THRESHOLD,
  calculateActivitySimilarity,
  normalizeActivityTokens,
} = require('../src/services/activityDomainSimilarity')

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
  const conflict = calculateConflict(event({ title: 'New Gathering', category: 'Food', neighborhood: 'Different', location: 'Different' }), event({ eventId: 'existing', title: 'Old Meetup', category: 'Sports' }))
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

test('activity threshold is deterministic and remains 0.60', () => {
  assert.equal(ACTIVITY_SIMILARITY_THRESHOLD, 0.6)
})

test('activity normalization removes activity stop words and normalizes aliases', () => {
  assert.deepEqual(normalizeActivityTokens('Local Football Tournaments'), new Set(['football', 'tournament']))
})

test('same football activity with different titles has high activity similarity', () => {
  const result = calculateActivitySimilarity(
    event({ title: 'Inter College Football Tournament', description: 'Football competition' }),
    event({ title: 'Weekend Football Training Camp', description: 'Football practice' }),
  )
  assert.ok(result.activitySimilarity >= 0.6)
  assert.equal(result.activityDomain, 'Football')
  assert.match(result.activityReason, /Similar activity domain: Football/)
})

test('same programming activity with different titles has high activity similarity', () => {
  const result = calculateActivitySimilarity(
    event({ title: 'Python Workshop for Beginners', description: 'Learn Python programming', category: 'Workshops' }),
    event({ title: 'Advanced Python Coding Workshop', description: 'Python development practice', category: 'Workshops' }),
  )
  assert.ok(result.activitySimilarity >= 0.6)
  assert.equal(result.activityDomain, 'Python')
})

test('same category but unrelated activity remains low', () => {
  const result = calculateActivitySimilarity(
    event({ title: 'Inter College Football Tournament', description: 'Football competition', category: 'Sports' }),
    event({ title: 'Cricket Practice Match', description: 'Cricket training', category: 'Sports' }),
  )
  assert.ok(result.activitySimilarity < 0.6)
  assert.equal(result.activityReason, '')
})

test('different categories with strong topic overlap still produce high activity similarity', () => {
  const result = calculateActivitySimilarity(
    event({ title: 'Python Coding Workshop', description: 'Programming practice', category: 'Workshops' }),
    event({ title: 'Python Coding Study Group', description: 'Programming discussion', category: 'Student Events' }),
  )
  assert.ok(result.activitySimilarity >= 0.6)
  assert.equal(result.activityDomain, 'Python Coding')
})

test('identical activity content produces maximum similarity', () => {
  const result = calculateActivitySimilarity(
    event({ title: 'Football Training', description: 'Football training camp' }),
    event({ title: 'Football Training', description: 'Football training camp' }),
  )
  assert.equal(result.activitySimilarity, 1)
})

test('generic token overlap can produce medium activity similarity without domain terms', () => {
  const result = calculateActivitySimilarity(
    event({ title: 'Neighborhood Book Club', description: 'Monthly reading group', category: 'Community' }),
    event({ title: 'Neighborhood Book Circle', description: 'Monthly discussion group', category: 'Community' }),
  )
  assert.ok(result.activitySimilarity >= 0.3 && result.activitySimilarity < 0.6)
})

test('unrelated activities produce low activity similarity', () => {
  const result = calculateActivitySimilarity(
    event({ title: 'Neighborhood Art Exhibit', description: 'Paintings and sculpture' }),
    event({ title: 'Football Match', description: 'Outdoor competition' }),
  )
  assert.ok(result.activitySimilarity < 0.3)
})

test('no shared activity or generic tokens produces zero similarity', () => {
  const result = calculateActivitySimilarity(
    event({ title: 'Football Training', description: '' }),
    event({ title: 'Python Workshop', description: '' }),
  )
  assert.equal(result.activitySimilarity, 0)
  assert.equal(result.activityDomain, 'Unknown / General')
})

test('activity intelligence does not modify the existing conflict score', () => {
  const withDescription = calculateConflict(
    event({ title: 'New Event', description: 'Football training', category: 'Sports' }),
    event({ eventId: 'existing', title: 'Old Event', description: 'Football training', category: 'Sports' }),
  )
  const withoutDescription = calculateConflict(
    event({ title: 'New Event', description: '', category: 'Sports' }),
    event({ eventId: 'existing', title: 'Old Event', description: '', category: 'Sports' }),
  )
  assert.equal(withDescription.conflictScore, withoutDescription.conflictScore)
})

test('activity reason is added only at the meaningful threshold', () => {
  const high = calculateConflict(
    event({ title: 'Football Training', description: 'Football practice' }),
    event({ eventId: 'existing', title: 'Weekend Football Camp', description: 'Football practice' }),
  )
  const low = calculateConflict(
    event({ title: 'Football Training', description: '' }),
    event({ eventId: 'existing', title: 'Python Workshop', description: '' }),
  )
  assert.ok(high.activitySimilarity >= 0.6)
  assert.ok(high.reasons.some((reason) => reason.startsWith('Similar activity domain:')))
  assert.equal(low.activityReason, '')
})

test('activity similarity is included separately from the existing 100-point score', () => {
  const conflict = calculateConflict(event(), event({ eventId: 'existing' }))
  assert.equal(conflict.conflictScore, 100)
  assert.ok(conflict.activitySimilarity >= 0)
  assert.ok(conflict.activitySimilarity <= 1)
})

test('existing threshold remains authoritative for conflict selection', () => {
  const conflicts = detectConflicts(event({ eventId: 'new', title: 'Football Training', category: 'Sports' }), [
    event({ eventId: 'weak', title: 'Cricket Practice', category: 'Sports', city: 'Erode', neighborhood: 'Other', location: 'Other', startTime: 3000, endTime: 4000 }),
  ])
  assert.equal(conflicts.length, 0)
})

test('activity similarity does not reorder conflicts', () => {
  const newEvent = event({ eventId: 'new', title: 'Football Training', description: 'Football practice', category: 'Sports' })
  const conflicts = detectConflicts(newEvent, [
    event({ eventId: 'lower', title: 'Football Training', description: 'Football practice', category: 'Sports', city: 'Coimbatore', neighborhood: 'Different', location: 'Different', startTime: 1000, endTime: 2000 }),
    event({ eventId: 'higher', title: 'Different Event', description: 'Football practice', category: 'Sports', startTime: 1000, endTime: 2000 }),
  ])
  assert.deepEqual(conflicts.map((item) => item.conflictingEventId), ['higher', 'lower'])
  assert.ok(conflicts[1].activitySimilarity >= 0.6)
})

test('event schema remains compatible with dynamic activity data', () => {
  const conflict = calculateConflict(event(), event({ eventId: 'existing' }))
  assert.equal(typeof conflict.eventId, 'string')
  assert.equal(typeof conflict.conflictingEventId, 'string')
  assert.equal(typeof conflict.conflictScore, 'number')
  assert.equal(typeof conflict.status, 'string')
  assert.ok(Array.isArray(conflict.reasons))
})

test('activity calculation uses title and description rather than location fields', () => {
  const sameActivity = calculateActivitySimilarity(
    event({ title: 'Football Training', description: 'Football practice', location: 'Hall A', city: 'Coimbatore' }),
    event({ title: 'Football Training', description: 'Football practice', location: 'Hall B', city: 'Erode' }),
  )
  const differentActivity = calculateActivitySimilarity(
    event({ title: 'Football Training', description: 'Football practice', location: 'Hall A', city: 'Coimbatore' }),
    event({ title: 'Python Workshop', description: 'Python coding', location: 'Hall A', city: 'Coimbatore' }),
  )
  assert.equal(sameActivity.activitySimilarity, 1)
  assert.equal(differentActivity.activitySimilarity, 0)
})
