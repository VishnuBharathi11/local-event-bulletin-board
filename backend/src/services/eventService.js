const eventRepository = require('../repositories/eventRepository')
const userRepository = require('../repositories/userRepository')
const { normalizeEvent, validateEventForCreation } = require('../models/eventModel')
const { canonicalizeEvent } = require('./eventCanonicalization')
const { generateEventEmbedding } = require('./eventEmbeddingService')
const conflictService = require('./conflictService')
const imageService = require('./imageService')
const { getDistrictFromCoords } = require('./geocodingService')

function getLifecycleStatus(event, now = Date.now()) {
  if (!event) return 'PUBLISHED'
  if (Number(event.endTime || event.expireAt) > 0 && now >= Number(event.endTime || event.expireAt)) return 'EXPIRED'
  if (Number(event.startTime) > 0 && now >= Number(event.startTime)) return 'ACTIVE'
  return event.status
}

async function attachOrganizerNames(events = []) {
  const organizerIds = [...new Set(events.map((event) => event.organizerId).filter(Boolean))]
  const users = await Promise.all(organizerIds.map(async (userId) => {
    try {
      return [userId, await userRepository.getUserById(userId)]
    } catch (error) {
      console.warn(`Failed to resolve organizer ${userId}:`, error.message)
      return [userId, null]
    }
  }))
  const names = new Map(users)
  return events.map((event) => ({
    ...event,
    organizerName: names.get(event.organizerId)?.name || 'Event Organizer',
    status: getLifecycleStatus(event),
  }))
}

async function getEvents(currentUserId) {
  const events = await eventRepository.getActiveEvents()
  let discoveryEvents = events
  if (currentUserId) discoveryEvents = events.filter(event => event.organizerId !== currentUserId)

  for (const event of discoveryEvents) {
    if (event.latitude && event.longitude && !event.district) {
      try {
        const resolved = await getDistrictFromCoords(event.latitude, event.longitude)
        if (resolved) {
          event.district = resolved
          await eventRepository.saveEvent(event)
        }
      } catch (err) {
        console.warn(`Failed to derive district for event ${event.eventId}:`, err.message)
      }
    }
  }

  return attachOrganizerNames(discoveryEvents)
}

async function getMyEvents(userId) {
  return attachOrganizerNames(await eventRepository.getUserEvents(userId))
}

async function getEventById(eventId) {
  const event = await eventRepository.getEventById(eventId)
  if (!event) return null
  const [enriched] = await attachOrganizerNames([event])
  return enriched
}

function withAuthenticatedOrganizer(input, userId) {
  return { ...input, organizerId: userId }
}

async function handleImageUpload(input) {
  if (input.imageUrl && input.imageUrl.startsWith('data:image')) {
    try {
      input.imageUrl = await imageService.uploadImage(input.imageUrl)
    } catch (error) {
      console.error('Image upload failed during event operation:', error)
      throw error
    }
  }
}

async function persistEventEmbedding(event) {
  const embedding = await generateEventEmbedding(canonicalizeEvent(event))
  await eventRepository.saveEventEmbedding(event.eventId, embedding)
}

async function createEvent(input, userId) {
  await handleImageUpload(input)
  const event = validateEventForCreation(withAuthenticatedOrganizer(input, userId))
  if (event.latitude && event.longitude && !event.district) event.district = await getDistrictFromCoords(event.latitude, event.longitude) || ''
  await conflictService.checkAndThrow(event)
  const createdEvent = await eventRepository.saveEvent(event)
  await persistEventEmbedding(createdEvent)
  return createdEvent
}

async function createEventAnyway(input, userId) {
  await handleImageUpload(input)
  const event = validateEventForCreation(withAuthenticatedOrganizer(input, userId))
  if (event.latitude && event.longitude && !event.district) event.district = await getDistrictFromCoords(event.latitude, event.longitude) || ''
  const conflicts = await conflictService.checkConflicts(event)
  const createdEvent = await eventRepository.saveEvent(event)
  if (conflicts.length > 0) await conflictService.saveConflicts(conflicts, createdEvent.eventId)
  await persistEventEmbedding(createdEvent)
  return createdEvent
}

async function checkEventConflicts(input, userId) {
  const event = validateEventForCreation(withAuthenticatedOrganizer(input, userId))
  const conflicts = await conflictService.checkConflicts(event)
  if (conflicts.length > 0) {
    const suggestions = await conflictService.suggestAlternatives(event)
    return { conflicts, suggestions }
  }
  return { conflicts: [] }
}

async function saveEvent(input, userId) {
  const existing = await eventRepository.getEventById(input.eventId)
  if (!existing) throw Object.assign(new Error('Event not found'), { statusCode: 404 })
  if (existing.organizerId !== userId) throw Object.assign(new Error('You are not authorized to perform this action.'), { statusCode: 403 })
  const twoHoursInMs = 2 * 60 * 60 * 1000
  if (existing.startTime - Date.now() < twoHoursInMs) throw Object.assign(new Error('Events cannot be edited less than 2 hours before the start time.'), { statusCode: 403 })

  await handleImageUpload(input)
  const event = normalizeEvent({ ...input, organizerId: existing.organizerId })
  if (event.latitude && event.longitude && (event.latitude !== existing.latitude || event.longitude !== existing.longitude || !event.district)) {
    event.district = await getDistrictFromCoords(event.latitude, event.longitude) || ''
  }
  const savedEvent = await eventRepository.saveEvent(event)
  await persistEventEmbedding(savedEvent)
  return savedEvent
}

async function deleteEvent(eventId, userId) {
  const existing = await eventRepository.getEventById(eventId)
  if (!existing) throw Object.assign(new Error('Event not found'), { statusCode: 404 })
  if (existing.organizerId !== userId) throw Object.assign(new Error('You are not authorized to perform this action.'), { statusCode: 403 })
  const twoHoursInMs = 2 * 60 * 60 * 1000
  if (existing.startTime - Date.now() < twoHoursInMs) throw Object.assign(new Error('Events cannot be deleted less than 2 hours before the start time.'), { statusCode: 403 })
  return eventRepository.deleteEvent(eventId)
}

module.exports = { getEvents, getMyEvents, getEventById, createEvent, createEventAnyway, checkEventConflicts, saveEvent, deleteEvent }
