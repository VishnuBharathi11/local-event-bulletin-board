const eventRequestRepository = require('../repositories/eventRequestRepository')
const { getDevelopmentUserId } = require('../config/developmentUser')
const { validateEventRequestForCreation } = require('../models/eventRequestModel')

async function getEventRequests() {
  return eventRequestRepository.getEventRequests()
}

async function getEventRequestById(requestId) {
  return eventRequestRepository.getEventRequestById(requestId)
}

async function createEventRequest(input) {
  const request = validateEventRequestForCreation(input, getDevelopmentUserId())
  return eventRequestRepository.createEventRequest(request)
}

async function getInterestStatus(requestId) {
  return eventRequestRepository.hasUserExpressedInterest(requestId, getDevelopmentUserId())
}

async function expressInterest(requestId) {
  return eventRequestRepository.expressInterest(requestId, getDevelopmentUserId())
}

async function assertOrganizer(requestId) {
  const request = await eventRequestRepository.getEventRequestById(requestId)
  if (!request) {
    const error = new Error('Event request not found')
    error.statusCode = 404
    throw error
  }
  if (request.organizerId !== getDevelopmentUserId()) {
    const error = new Error('Only the request organizer can perform this action')
    error.statusCode = 403
    throw error
  }
  return request
}

async function confirmEventRequest(requestId) {
  const request = await assertOrganizer(requestId)
  if (request.status !== 'THRESHOLD_REACHED') {
    const error = new Error('Event request must reach the demand threshold before confirmation')
    error.statusCode = 409
    throw error
  }
  return eventRequestRepository.confirmEventRequest(requestId)
}

async function declineEventRequest(requestId) {
  const request = await assertOrganizer(requestId)
  if (request.status !== 'THRESHOLD_REACHED') {
    const error = new Error('Event request must reach the demand threshold before decline')
    error.statusCode = 409
    throw error
  }
  await eventRequestRepository.declineEventRequest(requestId)
  return { requestId, status: 'DECLINED' }
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
