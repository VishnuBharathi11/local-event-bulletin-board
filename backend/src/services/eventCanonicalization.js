const CANONICAL_EVENT_FIELDS = Object.freeze([
  ['Title', 'title'],
  ['Description', 'description'],
  ['Category', 'category'],
  ['City', 'city'],
  ['Neighborhood', 'neighborhood'],
  ['Location', 'location'],
])

function canonicalizeEvent(event = {}) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new TypeError('event must be an object')
  }

  return CANONICAL_EVENT_FIELDS
    .map(([label, field]) => `${label}: ${String(event[field] ?? '').trim()}`)
    .join('\n')
}

module.exports = { CANONICAL_EVENT_FIELDS, canonicalizeEvent }
