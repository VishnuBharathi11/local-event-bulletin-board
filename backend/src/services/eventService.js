const eventRepository = require('../repositories/eventRepository')
const { normalizeEvent, validateEventForCreation } = require('../models/eventModel')
const conflictService = require('./conflictService')

async function getEvents() {
  return eventRepository.getEvents()
}

async function getEventById(eventId) {
  return eventRepository.getEventById(eventId)
}

async function createEvent(input) {
  const event = validateEventForCreation(input)
  await conflictService.checkAndThrow(event)
  return eventRepository.saveEvent(event)
}

async function createEventAnyway(input) {
  const event = validateEventForCreation(input)
  const conflicts = await conflictService.checkConflicts(event)
  const createdEvent = await eventRepository.saveEvent(event)
  if (conflicts.length > 0) await conflictService.saveConflicts(conflicts, createdEvent.eventId)
  return createdEvent
}

async function checkEventConflicts(input) {
  const event = validateEventForCreation(input)
  return conflictService.checkConflicts(event)
}

async function saveEvent(input) {
  const event = normalizeEvent(input)
  return eventRepository.saveEvent(event)
}

async function deleteEvent(eventId) {
  return eventRepository.deleteEvent(eventId)
}

module.exports = { getEvents, getEventById, createEvent, createEventAnyway, checkEventConflicts, saveEvent, deleteEvent }
