const eventRepository = require('../repositories/eventRepository')
const { normalizeEvent } = require('../models/eventModel')

async function getEvents() {
  return eventRepository.getEvents()
}

async function getEventById(eventId) {
  return eventRepository.getEventById(eventId)
}

async function saveEvent(input) {
  const event = normalizeEvent(input)
  return eventRepository.saveEvent(event)
}

async function deleteEvent(eventId) {
  return eventRepository.deleteEvent(eventId)
}

module.exports = {
  getEvents,
  getEventById,
  saveEvent,
  deleteEvent,
}
