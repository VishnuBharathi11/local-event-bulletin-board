const eventRepository = require('../repositories/eventRepository')
const { normalizeEvent, validateEventForCreation } = require('../models/eventModel')
const conflictService = require('./conflictService')
const imageService = require('./imageService')

async function getEvents() {
  return eventRepository.getActiveEvents()
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
  await conflictService.checkAndThrow(event)
  return eventRepository.saveEvent(event)
}

async function createEventAnyway(input, userId) {
  await handleImageUpload(input)
  const event = validateEventForCreation(withAuthenticatedOrganizer(input, userId))
  const conflicts = await conflictService.checkConflicts(event)
  const createdEvent = await eventRepository.saveEvent(event)
  if (conflicts.length > 0) await conflictService.saveConflicts(conflicts, createdEvent.eventId)
  return createdEvent
}

async function checkEventConflicts(input, userId) {
  const event = validateEventForCreation(withAuthenticatedOrganizer(input, userId))
  return conflictService.checkConflicts(event)
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
  await handleImageUpload(input)
  const event = normalizeEvent({ ...input, organizerId: existing.organizerId })
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
  return eventRepository.deleteEvent(eventId)
}

module.exports = { getEvents, getEventById, createEvent, createEventAnyway, checkEventConflicts, saveEvent, deleteEvent }
