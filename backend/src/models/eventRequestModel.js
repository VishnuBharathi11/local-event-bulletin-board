const EVENT_REQUEST_STATUSES = Object.freeze(['COLLECTING_DEMAND', 'THRESHOLD_REACHED', 'CONFIRMED', 'DECLINED'])
const EVENT_REQUEST_CATEGORIES = Object.freeze([
  'Sports', 'Music', 'Food', 'Workshops', 'Meetups', 'Student Events', 'Garage Sale', 'Community',
])
const DEFAULT_DEMAND_THRESHOLD = 20

function isSafeInteger(value) {
  return Number.isInteger(value) && Number.isSafeInteger(value)
}

function normalizeEventRequest(input = {}, requestId = input.requestId || '') {
  // Ensure we have a valid number for demandThreshold, falling back to default
  const rawThreshold = Number(input.demandThreshold)
  const demandThreshold = (Number.isInteger(rawThreshold) && rawThreshold > 0)
    ? rawThreshold
    : DEFAULT_DEMAND_THRESHOLD

  const request = {
    requestId: String(requestId || ''),
    title: input.title ?? '',
    description: input.description ?? '',
    category: input.category ?? '',
    city: input.city ?? '',
    neighborhood: input.neighborhood ?? '',
    location: input.location ?? '',
    district: input.district ?? '',
    startTime: Number(input.startTime ?? 0),
    endTime: Number(input.endTime ?? 0),
    demandCount: Number(input.demandCount ?? 0),
    demandThreshold,
    status: input.status ?? 'COLLECTING_DEMAND',
    createdAt: Number(input.createdAt ?? 0),
    organizerId: input.organizerId ?? '',
    imageUrl: input.imageUrl ?? '',
    eventId: input.eventId ?? '',
    latitude: input.latitude !== undefined && input.latitude !== null ? Number(input.latitude) : null,
    longitude: input.longitude !== undefined && input.longitude !== null ? Number(input.longitude) : null,
  }

  for (const field of ['title', 'description', 'category', 'city', 'neighborhood', 'location', 'district', 'organizerId', 'imageUrl', 'eventId']) {
    if (typeof request[field] !== 'string') throw new TypeError(`${field} must be a string`)
  }

  if (request.latitude !== null && (!Number.isFinite(request.latitude) || request.latitude < -90 || request.latitude > 90)) {
    throw new TypeError('latitude must be a finite number between -90 and 90')
  }
  if (request.longitude !== null && (!Number.isFinite(request.longitude) || request.longitude < -180 || request.longitude > 180)) {
    throw new TypeError('longitude must be a finite number between -180 and 180')
  }

  if (!isSafeInteger(request.startTime)) throw new TypeError('startTime must be a safe integer')
  if (!isSafeInteger(request.endTime)) throw new TypeError('endTime must be a safe integer')
  if (!isSafeInteger(request.createdAt)) throw new TypeError('createdAt must be a safe integer')
  if (!Number.isInteger(request.demandCount) || request.demandCount < 0) throw new TypeError('demandCount must be a non-negative integer')
  if (!Number.isInteger(request.demandThreshold) || request.demandThreshold <= 0) throw new TypeError('demandThreshold must be a positive integer')
  if (!EVENT_REQUEST_STATUSES.includes(request.status)) throw new TypeError(`status must be one of: ${EVENT_REQUEST_STATUSES.join(', ')}`)

  return request
}

function validateEventRequestForCreation(input = {}, organizerId) {
  const request = normalizeEventRequest({ ...input, organizerId })

  for (const field of ['title', 'description', 'category', 'city']) {
    if (!request[field].trim()) throw new TypeError(`${field} is required`)
  }
  if (!EVENT_REQUEST_CATEGORIES.includes(request.category)) {
    throw new TypeError(`category must be one of: ${EVENT_REQUEST_CATEGORIES.join(', ')}`)
  }

  if (request.startTime <= 0 || request.endTime <= 0) throw new TypeError('event date and time must be valid')
  if (request.endTime <= request.startTime) throw new TypeError('endTime must be after startTime')
  if (request.endTime <= Date.now()) throw new TypeError('requested time must be in the future')

  // Explicitly return the request with reset fields for creation
  return {
    ...request,
    demandCount: 0,
    status: 'COLLECTING_DEMAND',
    createdAt: Date.now(),
  }
}

function fromFirestoreDocument(snapshot) {
  if (!snapshot.exists) return null
  return normalizeEventRequest(snapshot.data(), snapshot.id)
}

function toFirestoreEventRequest(request) {
  const normalized = normalizeEventRequest(request)
  const { requestId: _requestId, ...fields } = normalized
  return fields
}

module.exports = {
  EVENT_REQUEST_STATUSES,
  EVENT_REQUEST_CATEGORIES,
  DEFAULT_DEMAND_THRESHOLD,
  normalizeEventRequest,
  validateEventRequestForCreation,
  fromFirestoreDocument,
  toFirestoreEventRequest,
}
