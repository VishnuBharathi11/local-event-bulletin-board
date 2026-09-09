const eventRequestService = require('../services/eventRequestService')

function handleError(res, error, operation = 'Event Request operation') {
  if (error.statusCode) {
    const body = { error: error.message }
    if (error.conflicts) body.conflicts = error.conflicts
    return res.status(error.statusCode).json(body)
  }
  if (error instanceof TypeError) return res.status(400).json({ error: error.message })
  if (error.message === 'Event request not found') return res.status(404).json({ error: error.message })
  console.error(`${operation} failed`, { firestoreCode: error.code, firestoreMessage: error.message, operation, collection: 'eventRequests' })
  return res.status(500).json({ error: 'Event request operation failed' })
}

async function getEventRequests(req, res) { try { return res.json(await eventRequestService.getEventRequests(req.user?.userId)) } catch (error) { return handleError(res, error, 'GET /api/event-requests') } }
async function getUserEventRequests(req, res) { try { return res.json(await eventRequestService.getUserEventRequests(req.user.userId)) } catch (error) { return handleError(res, error, 'GET /api/event-requests/mine') } }
async function getEventRequestById(req, res) { try { const request = await eventRequestService.getEventRequestById(req.params.requestId); if (!request) return res.status(404).json({ error: 'Event request not found' }); return res.json(request) } catch (error) { return handleError(res, error, 'GET /api/event-requests/:requestId') } }
async function createEventRequest(req, res) { try { return res.status(201).json(await eventRequestService.createEventRequest(req.body, req.user.userId)) } catch (error) { return handleError(res, error, 'POST /api/event-requests') } }
async function updateEventRequest(req, res) { try { return res.json(await eventRequestService.updateEventRequest(req.params.requestId, req.body, req.user.userId)) } catch (error) { return handleError(res, error, 'PATCH /api/event-requests/:requestId') } }
async function deleteEventRequest(req, res) { try { await eventRequestService.deleteEventRequest(req.params.requestId, req.user.userId); return res.status(204).send() } catch (error) { return handleError(res, error, 'DELETE /api/event-requests/:requestId') } }
async function getInterestStatus(req, res) { try { const request = await eventRequestService.getEventRequestById(req.params.requestId); if (!request) return res.status(404).json({ error: 'Event request not found' }); return res.json({ interested: await eventRequestService.getInterestStatus(req.params.requestId, req.user.userId) }) } catch (error) { return handleError(res, error, 'GET /api/event-requests/:requestId/interest') } }
async function expressInterest(req, res) { try { return res.json(await eventRequestService.expressInterest(req.params.requestId, req.user.userId)) } catch (error) { return handleError(res, error, 'POST /api/event-requests/:requestId/interest') } }
async function removeInterest(req, res) { try { return res.json(await eventRequestService.removeInterest(req.params.requestId, req.user.userId)) } catch (error) { return handleError(res, error, 'DELETE /api/event-requests/:requestId/interest') } }
async function confirmEventRequest(req, res) { try { return res.status(201).json(await eventRequestService.confirmEventRequest(req.params.requestId, req.user.userId)) } catch (error) { return handleError(res, error, 'POST /api/event-requests/:requestId/confirm') } }
async function confirmEventRequestAnyway(req, res) { try { return res.status(201).json(await eventRequestService.confirmEventRequestAnyway(req.params.requestId, req.user.userId)) } catch (error) { return handleError(res, error, 'POST /api/event-requests/:requestId/confirm-anyway') } }
async function declineEventRequest(req, res) { try { return res.json(await eventRequestService.declineEventRequest(req.params.requestId, req.user.userId)) } catch (error) { return handleError(res, error, 'POST /api/event-requests/:requestId/decline') } }

module.exports = { getEventRequests, getUserEventRequests, getEventRequestById, createEventRequest, updateEventRequest, deleteEventRequest, getInterestStatus, expressInterest, removeInterest, confirmEventRequest, confirmEventRequestAnyway, declineEventRequest }
