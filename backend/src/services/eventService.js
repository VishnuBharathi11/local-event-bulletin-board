const eventRepository = require('../repositories/eventRepository')
const { normalizeEvent, validateEventForCreation } = require('../models/eventModel')
const conflictService = require('./conflictService')
const imageService = require('./imageService')
const { getDistrictFromCoords } = require('./geocodingService')

async function getEvents(currentUserId) {
  const events = await eventRepository.getActiveEvents()

  // Hide user's own events from the discovery board
  let discoveryEvents = events;
  if (currentUserId) {
    discoveryEvents = events.filter(event => event.organizerId !== currentUserId)
  }

  // Reliability: Ensure all events have a district if they have coords
  // This satisfies the "derive using existing mechanism" requirement.
  for (const event of discoveryEvents) {
    if (event.latitude && event.longitude && !event.district) {
       try {
         const resolved = await getDistrictFromCoords(event.latitude, event.longitude);
         if (resolved) {
           event.district = resolved;
           // Silently update repository for future calls
           await eventRepository.saveEvent(event);
         }
       } catch (err) {
         console.warn(`Failed to derive district for event ${event.eventId}:`, err.message);
       }
    }
  }

  return discoveryEvents
}

async function getMyEvents(userId) {
  return eventRepository.getUserEvents(userId)
}

async function getEventById(eventId) {
  return eventRepository.getEventById(eventId)
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

async function createEvent(input, userId) {
  await handleImageUpload(input)
  const event = validateEventForCreation(withAuthenticatedOrganizer(input, userId))

  if (event.latitude && event.longitude && !event.district) {
    event.district = await getDistrictFromCoords(event.latitude, event.longitude) || ''
  }

  await conflictService.checkAndThrow(event)
  return eventRepository.saveEvent(event)
}

async function createEventAnyway(input, userId) {
  await handleImageUpload(input)
  const event = validateEventForCreation(withAuthenticatedOrganizer(input, userId))

  if (event.latitude && event.longitude && !event.district) {
    event.district = await getDistrictFromCoords(event.latitude, event.longitude) || ''
  }

  const conflicts = await conflictService.checkConflicts(event)
  const createdEvent = await eventRepository.saveEvent(event)
  if (conflicts.length > 0) await conflictService.saveConflicts(conflicts, createdEvent.eventId)
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
  if (!existing) {
    const error = new Error('Event not found')
    error.statusCode = 404
    throw error
  }
  if (existing.organizerId !== userId) {
    const error = new Error('You are not authorized to perform this action.')
    error.statusCode = 403
    throw error
  }

  // Enforce 2-hour rule
  const twoHoursInMs = 2 * 60 * 60 * 1000
  if (existing.startTime - Date.now() < twoHoursInMs) {
    const error = new Error('Events cannot be edited less than 2 hours before the start time.')
    error.statusCode = 403
    throw error
  }

  await handleImageUpload(input)
  const event = normalizeEvent({ ...input, organizerId: existing.organizerId })

  if (event.latitude && event.longitude && (event.latitude !== existing.latitude || event.longitude !== existing.longitude || !event.district)) {
    event.district = await getDistrictFromCoords(event.latitude, event.longitude) || ''
  }

  return eventRepository.saveEvent(event)
}

async function deleteEvent(eventId, userId) {
  const existing = await eventRepository.getEventById(eventId)
  if (!existing) {
    const error = new Error('Event not found')
    error.statusCode = 404
    throw error
  }
  if (existing.organizerId !== userId) {
    const error = new Error('You are not authorized to perform this action.')
    error.statusCode = 403
    throw error
  }

  // Enforce 2-hour rule
  const twoHoursInMs = 2 * 60 * 60 * 1000
  if (existing.startTime - Date.now() < twoHoursInMs) {
    const error = new Error('Events cannot be deleted less than 2 hours before the start time.')
    error.statusCode = 403
    throw error
  }

  return eventRepository.deleteEvent(eventId)
}

module.exports = { getEvents, getMyEvents, getEventById, createEvent, createEventAnyway, checkEventConflicts, saveEvent, deleteEvent }
