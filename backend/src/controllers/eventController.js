const eventService = require('../services/eventService')

function handleError(res, error) {
  if (error instanceof TypeError) {
    return res.status(400).json({ error: error.message })
  }

  console.error('Event API error:', error)
  return res.status(500).json({ error: 'Event data operation failed' })
}

async function getEvents(_req, res) {
  try {
    res.json(await eventService.getEvents())
  } catch (error) {
    handleError(res, error)
  }
}

async function getEventById(req, res) {
  try {
    const event = await eventService.getEventById(req.params.eventId)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    return res.json(event)
  } catch (error) {
    return handleError(res, error)
  }
}

async function createEvent(req, res) {
  try {
    const event = await eventService.saveEvent(req.body)
    return res.status(201).json(event)
  } catch (error) {
    return handleError(res, error)
  }
}

async function updateEvent(req, res) {
  try {
    const existing = await eventService.getEventById(req.params.eventId)
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const event = await eventService.saveEvent({
      ...req.body,
      eventId: req.params.eventId,
    })
    return res.json(event)
  } catch (error) {
    return handleError(res, error)
  }
}

async function deleteEvent(req, res) {
  try {
    const existing = await eventService.getEventById(req.params.eventId)
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' })
    }

    await eventService.deleteEvent(req.params.eventId)
    return res.status(204).send()
  } catch (error) {
    return handleError(res, error)
  }
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
}
