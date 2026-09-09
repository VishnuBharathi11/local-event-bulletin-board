const test = require('node:test')
const assert = require('node:assert/strict')
const { isEventExpired, filterActiveEvents } = require('../src/repositories/eventRepository')

function event(eventId, expireAt) {
  return { eventId, expireAt }
}

test('non-expired event is retained when currentTime is before expireAt', () => {
  assert.equal(isEventExpired(event('future', 2000), 1999), false)
  assert.deepEqual(filterActiveEvents([event('future', 2000)], 1999).map((item) => item.eventId), ['future'])
})

test('event is excluded exactly at expireAt', () => {
  assert.equal(isEventExpired(event('ending', 2000), 2000), true)
  assert.deepEqual(filterActiveEvents([event('ending', 2000)], 2000), [])
})

test('event is excluded after expireAt', () => {
  assert.equal(isEventExpired(event('expired', 2000), 2001), true)
  assert.deepEqual(filterActiveEvents([event('expired', 2000)], 2001), [])
})

test('active filtering does not mutate or delete the source event objects', () => {
  const events = [event('future', 2000), event('expired', 1000)]
  const active = filterActiveEvents(events, 1500)

  assert.deepEqual(events, [event('future', 2000), event('expired', 1000)])
  assert.deepEqual(active, [event('future', 2000)])
})
