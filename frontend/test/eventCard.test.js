import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = fs.readFileSync(fileURLToPath(new URL('../src/components/events/EventCard.jsx', import.meta.url)), 'utf8')

test('EventCard reuses the existing RSVP hook and exposes the RSVP action directly on the card', () => {
  assert.match(source, /useEventRSVP\(event\.eventId, authenticated\)/)
  assert.match(source, /rsvp\.setGoing\(\)/)
  assert.match(source, /rsvp\.setNotGoing\(\)/)
  assert.match(source, /onRsvpChanged\?\.\(\)/)
  assert.match(source, /type="button"[^>]*onClick=\{handleGoing\}/)
  assert.match(source, /type="button"[^>]*onClick=\{handleNotGoing\}/)
})

test('EventCard keeps Event Details navigation as a separate link', () => {
  assert.match(source, /to=\{`\/events\/\$\{encodeURIComponent\(event\.eventId\)\}`\}/)
  assert.match(source, /View Event/)
})

test('EventCard does not wrap the RSVP buttons inside the Event Details link', () => {
  const rsvpIndex = source.indexOf('onClick={handleGoing}')
  const eventLinkIndex = source.indexOf('View Event')
  assert.ok(rsvpIndex >= 0 && eventLinkIndex >= 0)
  assert.ok(rsvpIndex < eventLinkIndex)
})
