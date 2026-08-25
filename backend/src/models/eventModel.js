const EVENT_STATUSES = Object.freeze(['DRAFT', 'PUBLISHED', 'ACTIVE', 'EXPIRED'])

const DEFAULT_EVENT = Object.freeze({
  eventId: '',
  title: '',
  description: '',
  category: '',
  city: '',
  neighborhood: '',
  location: '',
  startTime: 0,
  endTime: 0,
  status: 'DRAFT',
  rsvpCount: 0,
  organizerId: '',
  createdAt: 0,
  expireAt: 0,
  conflictStatus: 'NONE',
})

function isSafeInteger(value) {
  return Number.isInteger(value) && Number.isSafeInteger(value)
}

function normalizeEvent(input = {}, eventId = input.eventId || '') {
  const event = {
    eventId: String(eventId || ''),
    title: input.title ?? DEFAULT_EVENT.title,
    description: input.description ?? DEFAULT_EVENT.description,
    category: input.category ?? DEFAULT_EVENT.category,
    city: input.city ?? DEFAULT_EVENT.city,
    neighborhood: input.neighborhood ?? DEFAULT_EVENT.neighborhood,
    location: input.location ?? DEFAULT_EVENT.location,
    startTime: input.startTime ?? DEFAULT_EVENT.startTime,
    endTime: input.endTime ?? DEFAULT_EVENT.endTime,
    status: input.status ?? DEFAULT_EVENT.status,
    rsvpCount: input.rsvpCount ?? DEFAULT_EVENT.rsvpCount,
    organizerId: input.organizerId ?? DEFAULT_EVENT.organizerId,
    createdAt: input.createdAt ?? DEFAULT_EVENT.createdAt,
    expireAt: input.expireAt ?? DEFAULT_EVENT.expireAt,
    conflictStatus: input.conflictStatus ?? DEFAULT_EVENT.conflictStatus,
  }

  const stringFields = ['title', 'description', 'category', 'city', 'neighborhood', 'location', 'organizerId', 'conflictStatus']
  for (const field of stringFields) {
    if (typeof event[field] !== 'string') {
      throw new TypeError(`${field} must be a string`)
    }
  }

  for (const field of ['startTime', 'endTime', 'createdAt', 'expireAt']) {
    if (!isSafeInteger(event[field])) {
      throw new TypeError(`${field} must be a safe integer`)
    }
  }

  if (!Number.isInteger(event.rsvpCount)) {
    throw new TypeError('rsvpCount must be an integer')
  }

  if (!EVENT_STATUSES.includes(event.status)) {
    throw new TypeError(`status must be one of: ${EVENT_STATUSES.join(', ')}`)
  }

  return event
}

function toFirestoreEvent(event) {
  const normalized = normalizeEvent(event)
  const { eventId: _eventId, ...firestoreFields } = normalized
  return firestoreFields
}

function fromFirestoreDocument(snapshot) {
  if (!snapshot.exists) return null
  return normalizeEvent(snapshot.data(), snapshot.id)
}

module.exports = {
  DEFAULT_EVENT,
  EVENT_STATUSES,
  normalizeEvent,
  toFirestoreEvent,
  fromFirestoreDocument,
}
