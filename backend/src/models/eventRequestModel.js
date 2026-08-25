const EVENT_REQUEST_STATUSES = Object.freeze(['COLLECTING_DEMAND', 'THRESHOLD_REACHED', 'CONFIRMED', 'DECLINED'])
const EVENT_REQUEST_CATEGORIES = Object.freeze([
  'Sports', 'Music', 'Food', 'Workshops', 'Meetups', 'Student Events', 'Garage Sale', 'Community',
])
const DEFAULT_DEMAND_THRESHOLD = 20

function isSafeInteger(value) {
  return Number.isInteger(value) && Number.isSafeInteger(value)
}

function normalizeEventRequest(input = {}, requestId = input.requestId || '') {
  const request = {
    requestId: String(requestId || ''),
    title: input.title ?? '',
    description: input.description ?? '',
    category: input.category ?? '',
    city: input.city ?? '',
    neighborhood: input.neighborhood ?? '',
    location: input.location ?? '',
    startTime: input.startTime ?? 0,
    endTime: input.endTime ?? 0,
    demandCount: input.demandCount ?? 0,
    demandThreshold: input.demandThreshold ?? DEFAULT_DEMAND_THRESHOLD,
    status: input.status ?? 'COLLECTING_DEMAND',
    createdAt: input.createdAt ?? 0,
    organizerId: input.organizerId ?? '',
  }

  for (const field of ['title', 'description', 'category', 'city', 'neighborhood', 'location', 'organizerId']) {
    if (typeof request[field] !== 'string') throw new TypeError(`${field} must be a string`)
  }
  for (const field of ['startTime', 'endTime', 'createdAt']) {
    if (!isSafeInteger(request[field])) throw new TypeError(`${field} must be a safe integer`)
  }
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
  return {
    ...request,
    demandCount: 0,
    demandThreshold: DEFAULT_DEMAND_THRESHOLD,
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
