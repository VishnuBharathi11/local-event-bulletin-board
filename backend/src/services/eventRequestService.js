const eventRequestRepository = require('../repositories/eventRequestRepository')
const { validateEventRequestForCreation } = require('../models/eventRequestModel')
const { normalizeEvent } = require('../models/eventModel')
const conflictService = require('./conflictService')
const imageService = require('./imageService')

async function getEventRequests() {
  return eventRequestRepository.getEventRequests()
}

async function getUserEventRequests(userId) {
  return eventRequestRepository.getUserEventRequests(userId)
}

async function getEventRequestById(requestId) {
  return eventRequestRepository.getEventRequestById(requestId)
}

async function createEventRequest(input, userId) {
  if (input.imageUrl && input.imageUrl.startsWith('data:image')) {
    try {
      input.imageUrl = await imageService.uploadImage(input.imageUrl)
    } catch (error) {
      console.error('Image upload failed during event request creation:', error)
      throw error
    }
  }
  const request = validateEventRequestForCreation(input, userId)
  return eventRequestRepository.createEventRequest(request)
}

async function updateEventRequest(requestId, input, userId) {
  const existing = await assertOrganizer(requestId, userId)

  if (existing.status === 'CONFIRMED' || existing.eventId) {
    const error = new Error('Cannot edit a request that has already been confirmed.')
    error.statusCode = 400
    throw error
  }

  // Only allow updating certain fields
  const updates = {
    title: input.title || existing.title,
    description: input.description || existing.description,
    category: input.category || existing.category,
    city: input.city || existing.city,
    neighborhood: input.neighborhood || existing.neighborhood,
    location: input.location || existing.location,
    startTime: Number(input.startTime) || existing.startTime,
    endTime: Number(input.endTime) || existing.endTime,
    demandThreshold: Number(input.demandThreshold) || existing.demandThreshold,
  }

  if (input.imageUrl && input.imageUrl !== existing.imageUrl) {
    if (input.imageUrl.startsWith('data:image')) {
      updates.imageUrl = await imageService.uploadImage(input.imageUrl)
    } else {
      updates.imageUrl = input.imageUrl
    }
  }

  return eventRequestRepository.updateEventRequest(requestId, updates)
}

async function deleteEventRequest(requestId, userId) {
  const existing = await assertOrganizer(requestId, userId)

  if (existing.status === 'CONFIRMED' || existing.eventId) {
    const error = new Error('Cannot delete a request that has already been confirmed.')
    error.statusCode = 400
    throw error
  }

  return eventRequestRepository.deleteEventRequest(requestId)
}

async function getInterestStatus(requestId, userId) {
  return eventRequestRepository.hasUserExpressedInterest(requestId, userId)
}

async function expressInterest(requestId, userId) {
  return eventRequestRepository.expressInterest(requestId, userId)
}

async function assertOrganizer(requestId, userId) {
  const request = await eventRequestRepository.getEventRequestById(requestId)
  if (!request) {
    const error = new Error('Event request not found')
    error.statusCode = 404
    throw error
  }
  if (request.organizerId !== userId) {
    const error = new Error('You are not authorized to perform this action.')
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
    imageUrl: request.imageUrl || '',
  })
}

async function confirmEventRequest(requestId, userId) {
  const request = await assertOrganizer(requestId, userId)
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

async function confirmEventRequestAnyway(requestId, userId) {
  const request = await assertOrganizer(requestId, userId)
  if (request.status !== 'THRESHOLD_REACHED') {
    const error = new Error('Event request must reach the demand threshold before confirmation')
    error.statusCode = 409
    throw error
  }
  return eventRequestRepository.confirmEventRequest(requestId)
}

async function declineEventRequest(requestId, userId) {
  const request = await assertOrganizer(requestId, userId)
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
