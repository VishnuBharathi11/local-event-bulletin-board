const EVENT_CONFLICT_STATUSES = Object.freeze(['POTENTIAL', 'DISMISSED', 'REVIEWED'])

const DEFAULT_EVENT_CONFLICT = Object.freeze({
  conflictId: '',
  eventId: '',
  conflictingEventId: '',
  conflictScore: 0,
  reasons: [],
  status: 'POTENTIAL',
  createdAt: 0,
})

function normalizeEventConflict(input = {}) {
  const conflict = {
    conflictId: String(input.conflictId ?? DEFAULT_EVENT_CONFLICT.conflictId),
    eventId: String(input.eventId ?? DEFAULT_EVENT_CONFLICT.eventId),
    conflictingEventId: String(input.conflictingEventId ?? DEFAULT_EVENT_CONFLICT.conflictingEventId),
    conflictScore: input.conflictScore ?? DEFAULT_EVENT_CONFLICT.conflictScore,
    reasons: Array.isArray(input.reasons) ? input.reasons.map(String) : [],
    status: input.status ?? DEFAULT_EVENT_CONFLICT.status,
    createdAt: input.createdAt ?? Date.now(),
  }

  if (!Number.isInteger(conflict.conflictScore)) throw new TypeError('conflictScore must be an integer')
  if (!EVENT_CONFLICT_STATUSES.includes(conflict.status)) {
    throw new TypeError(`status must be one of: ${EVENT_CONFLICT_STATUSES.join(', ')}`)
  }
  if (!Number.isSafeInteger(conflict.createdAt)) throw new TypeError('createdAt must be a safe integer')
  if (!conflict.conflictingEventId) throw new TypeError('conflictingEventId is required')
  return conflict
}

function toFirestoreEventConflict(conflict) {
  const normalized = normalizeEventConflict(conflict)
  const { conflictId: _conflictId, ...fields } = normalized
  return fields
}

function fromFirestoreDocument(snapshot) {
  if (!snapshot.exists) return null
  return normalizeEventConflict(snapshot.data(), snapshot.id)
}

module.exports = {
  EVENT_CONFLICT_STATUSES,
  normalizeEventConflict,
  toFirestoreEventConflict,
  fromFirestoreDocument,
}
