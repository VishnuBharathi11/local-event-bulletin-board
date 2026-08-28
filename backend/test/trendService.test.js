const test = require('node:test')
const assert = require('node:assert/strict')
const { groupCounts, groupRsvps, calculateVelocity, calculateRsvpVelocity, rankHotCategories } = require('../src/services/trendService')

test('groupCounts ranks event activity deterministically', () => {
  const result = groupCounts([
    { category: 'Music' },
    { category: 'Sports' },
    { category: 'Music' },
    { category: 'Food' },
  ], 'category')
  assert.deepEqual(result, [
    { name: 'Music', count: 2 },
    { name: 'Food', count: 1 },
    { name: 'Sports', count: 1 },
  ])
})

test('groupRsvps sums RSVP counts by category', () => {
  const result = groupRsvps([
    { category: 'Music', rsvpCount: 8 },
    { category: 'Music', rsvpCount: 2 },
    { category: 'Sports', rsvpCount: 5 },
  ], 'category')
  assert.deepEqual(result, [
    { name: 'Music', rsvps: 10 },
    { name: 'Sports', rsvps: 5 },
  ])
})

test('calculateVelocity compares activity rates between two equal periods', () => {
  const events = [
    { createdAt: 100 },
    { createdAt: 200 },
    { createdAt: 700 },
    { createdAt: 800 },
    { createdAt: 900 },
  ]
  const result = calculateVelocity(events, 'createdAt', 0, 1000)
  assert.equal(result.firstPeriodCount, 2)
  assert.equal(result.secondPeriodCount, 3)
  assert.equal(result.changePercent, 50)
})

test('calculateRsvpVelocity uses RSVP creation timestamps', () => {
  const rsvps = [
    { createdAt: 100 },
    { createdAt: 200 },
    { createdAt: 700 },
    { createdAt: 800 },
  ]
  const result = calculateRsvpVelocity(rsvps, 0, 1000)
  assert.equal(result.firstPeriodCount, 2)
  assert.equal(result.secondPeriodCount, 2)
  assert.equal(result.changePercent, 0)
})

test('rankHotCategories prioritizes RSVP activity and then event count', () => {
  const result = rankHotCategories(
    [{ name: 'Food', count: 5 }, { name: 'Music', count: 2 }, { name: 'Sports', count: 2 }],
    [{ name: 'Music', rsvps: 20 }, { name: 'Sports', rsvps: 10 }, { name: 'Food', rsvps: 10 }],
  )
  assert.deepEqual(result, [
    { name: 'Music', eventCount: 2, rsvps: 20 },
    { name: 'Food', eventCount: 5, rsvps: 10 },
    { name: 'Sports', eventCount: 2, rsvps: 10 },
  ])
})
