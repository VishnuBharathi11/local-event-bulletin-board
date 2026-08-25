const eventService = require('../services/eventService')

function handleError(res, error) {
  if (error.statusCode) {
    const body = { error: error.message }
    if (error.conflicts) body.conflicts = error.conflicts
    return res.status(error.statusCode).json(body)
  }
  if (error instanceof TypeError) return res.status(400).json({ error: error.message })
  console.error('Event API error:', error)
  return res.status(500).json({ error: 'Event data operation failed' })
}

async function getEvents(_req, res) {
  try { return res.json(await eventService.getEvents()) } catch (error) { return handleError(res, error) }
}

async function getEventById(req, res) {
  try {
    const event = await eventService.getEventById(req.params.eventId)
    if (!event) return res.status(404).json({ error: 'Event not found' })
    return res.json(event)
  } catch (error) { return handleError(res, error) }
}

async function createEvent(req, res) {
  try {
    const event = await eventService.createEvent(req.body, req.user.userId)
    return res.status(201).json(event)
  } catch (error) { return handleError(res, error) }
}

async function checkEventConflicts(req, res) {
  try { return res.json({ conflicts: await eventService.checkEventConflicts(req.body, req.user.userId) }) } catch (error) { return handleError(res, error) }
}

async function createEventAnyway(req, res) {
  try { return res.status(201).json(await eventService.createEventAnyway(req.body, req.user.userId)) } catch (error) { return handleError(res, error) }
}

async function updateEvent(req, res) {
  try {
    const event = await eventService.saveEvent({ ...req.body, eventId: req.params.eventId }, req.user.userId)
    return res.json(event)
  } catch (error) { return handleError(res, error) }
}

async function deleteEvent(req, res) {
  try {
    await eventService.deleteEvent(req.params.eventId, req.user.userId)
    return res.status(204).send()
  } catch (error) { return handleError(res, error) }
}

module.exports = { getEvents, getEventById, createEvent, checkEventConflicts, createEventAnyway, updateEvent, deleteEvent }
