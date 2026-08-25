const eventRequestRepository = require('../repositories/eventRequestRepository')
const { getDevelopmentUserId } = require('../config/developmentUser')
const { validateEventRequestForCreation } = require('../models/eventRequestModel')
const { normalizeEvent } = require('../models/eventModel')
const conflictService = require('./conflictService')

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

function requestToConflictEvent(request) {
  return normalizeEvent({
    eventId: '',
    title: request.title,
    description: request.description,
    category: request.category,
    city: request.city,
    neighborhood: request.neighborhood,
    location: request.location,
    startTime: request.startTime,
    endTime: request.endTime,
    status: 'PUBLISHED',
    rsvpCount: 0,
    organizerId: request.organizerId,
    createdAt: request.createdAt,
    expireAt: request.endTime,
    conflictStatus: 'NONE',
  })
}

async function confirmEventRequest(requestId) {
  const request = await assertOrganizer(requestId)
  if (request.status !== 'THRESHOLD_REACHED') {
    const error = new Error('Event request must reach the demand threshold before confirmation')
    error.statusCode = 409
    throw error
  }

  const conflicts = await conflictService.checkConflicts(requestToConflictEvent(request))
  if (conflicts.length > 0) {
    const error = new Error('Potential event conflict detected')
    error.statusCode = 409
    error.conflicts = conflicts
    throw error
  }

  return eventRequestRepository.confirmEventRequest(requestId)
}

async function confirmEventRequestAnyway(requestId) {
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
  confirmEventRequestAnyway,
  declineEventRequest,
}
