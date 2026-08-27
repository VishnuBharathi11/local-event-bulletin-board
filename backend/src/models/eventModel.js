const EVENT_STATUSES = Object.freeze(['DRAFT', 'PUBLISHED', 'ACTIVE', 'EXPIRED'])
const EVENT_CATEGORIES = Object.freeze([
  'Sports',
  'Music',
  'Food',
  'Workshops',
  'Meetups',
  'Student Events',
  'Garage Sale',
  'Community',
])

const DEFAULT_EVENT = Object.freeze({
  eventId: '', title: '', description: '', category: '', city: '', neighborhood: '', location: '',
  startTime: 0, endTime: 0, status: 'DRAFT', rsvpCount: 0, organizerId: '', createdAt: 0, expireAt: 0, conflictStatus: 'NONE',
  imageUrl: '',
  latitude: null,
  longitude: null,
})

function isSafeInteger(value) {
  return Number.isInteger(value) && Number.isSafeInteger(value)
}

function normalizeEvent(input = {}, eventId = input.eventId || '') {
  const event = {
    eventId: String(eventId || ''), title: input.title ?? DEFAULT_EVENT.title, description: input.description ?? DEFAULT_EVENT.description,
    category: input.category ?? DEFAULT_EVENT.category, city: input.city ?? DEFAULT_EVENT.city, neighborhood: input.neighborhood ?? DEFAULT_EVENT.neighborhood,
    location: input.location ?? DEFAULT_EVENT.location, startTime: input.startTime ?? DEFAULT_EVENT.startTime, endTime: input.endTime ?? DEFAULT_EVENT.endTime,
    status: input.status ?? DEFAULT_EVENT.status, rsvpCount: input.rsvpCount ?? DEFAULT_EVENT.rsvpCount, organizerId: input.organizerId ?? DEFAULT_EVENT.organizerId,
    createdAt: input.createdAt ?? DEFAULT_EVENT.createdAt, expireAt: input.expireAt ?? DEFAULT_EVENT.expireAt, conflictStatus: input.conflictStatus ?? DEFAULT_EVENT.conflictStatus,
    imageUrl: input.imageUrl ?? DEFAULT_EVENT.imageUrl,
    latitude: input.latitude !== undefined && input.latitude !== null ? Number(input.latitude) : null,
    longitude: input.longitude !== undefined && input.longitude !== null ? Number(input.longitude) : null,
  }

  const stringFields = ['title', 'description', 'category', 'city', 'neighborhood', 'location', 'organizerId', 'conflictStatus', 'imageUrl']
  for (const field of stringFields) if (typeof event[field] !== 'string') throw new TypeError(`${field} must be a string`)
  for (const field of ['startTime', 'endTime', 'createdAt', 'expireAt']) if (!isSafeInteger(event[field])) throw new TypeError(`${field} must be a safe integer`)
  if (!Number.isInteger(event.rsvpCount)) throw new TypeError('rsvpCount must be an integer')
  if (!EVENT_STATUSES.includes(event.status)) throw new TypeError(`status must be one of: ${EVENT_STATUSES.join(', ')}`)

  if (event.latitude !== null && (!Number.isFinite(event.latitude) || event.latitude < -90 || event.latitude > 90)) {
    throw new TypeError('latitude must be a finite number between -90 and 90')
  }
  if (event.longitude !== null && (!Number.isFinite(event.longitude) || event.longitude < -180 || event.longitude > 180)) {
    throw new TypeError('longitude must be a finite number between -180 and 180')
  }

  return event
}

function validateEventForCreation(event) {
  const normalized = normalizeEvent(event)
  for (const field of ['title', 'description', 'category', 'location', 'city', 'neighborhood']) {
    if (!normalized[field].trim()) throw new TypeError(`${field} is required`)
  }
  if (!EVENT_CATEGORIES.includes(normalized.category)) throw new TypeError(`category must be one of: ${EVENT_CATEGORIES.join(', ')}`)
  if (normalized.status !== 'PUBLISHED') throw new TypeError('status must be PUBLISHED for a new event')
  if (normalized.startTime <= 0 || normalized.endTime <= 0) throw new TypeError('event date and time must be valid')
  if (normalized.endTime <= normalized.startTime) throw new TypeError('endTime must be after startTime')
  if (normalized.endTime <= Date.now()) throw new TypeError('event must end in the future')
  if (normalized.expireAt !== normalized.endTime) throw new TypeError('expireAt must match endTime')
  return normalized
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

module.exports = { DEFAULT_EVENT, EVENT_STATUSES, EVENT_CATEGORIES, normalizeEvent, validateEventForCreation, toFirestoreEvent, fromFirestoreDocument }
