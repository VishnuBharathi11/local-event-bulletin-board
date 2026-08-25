const eventRequestService = require('../services/eventRequestService')

function handleError(res, error) {
  if (error.statusCode) return res.status(error.statusCode).json({ error: error.message })
  if (error instanceof TypeError) return res.status(400).json({ error: error.message })
  if (error.message === 'Event request not found') return res.status(404).json({ error: error.message })
  console.error('Event Request API error:', error)
  return res.status(500).json({ error: 'Event request operation failed' })
}

async function getEventRequests(_req, res) {
  try { return res.json(await eventRequestService.getEventRequests()) } catch (error) { return handleError(res, error) }
}

async function getEventRequestById(req, res) {
  try {
    const request = await eventRequestService.getEventRequestById(req.params.requestId)
    if (!request) return res.status(404).json({ error: 'Event request not found' })
    return res.json(request)
  } catch (error) { return handleError(res, error) }
}

async function createEventRequest(req, res) {
  try {
    return res.status(201).json(await eventRequestService.createEventRequest(req.body))
  } catch (error) { return handleError(res, error) }
}

async function getInterestStatus(req, res) {
  try {
    const request = await eventRequestService.getEventRequestById(req.params.requestId)
    if (!request) return res.status(404).json({ error: 'Event request not found' })
    return res.json({ interested: await eventRequestService.getInterestStatus(req.params.requestId) })
  } catch (error) { return handleError(res, error) }
}

async function expressInterest(req, res) {
  try {
    const request = await eventRequestService.expressInterest(req.params.requestId)
    return res.json(request)
  } catch (error) { return handleError(res, error) }
}

async function confirmEventRequest(req, res) {
  try {
    return res.status(201).json(await eventRequestService.confirmEventRequest(req.params.requestId))
  } catch (error) { return handleError(res, error) }
}

async function declineEventRequest(req, res) {
  try {
    return res.json(await eventRequestService.declineEventRequest(req.params.requestId))
  } catch (error) { return handleError(res, error) }
}

module.exports = {
  getEventRequests,
  getEventRequestById,
  createEventRequest,
  getInterestStatus,
  expressInterest,
  confirmEventRequest,
  declineEventRequest,
}
