const eventRequestRepository = require('../repositories/eventRequestRepository')
const { validateEventRequestForCreation } = require('../models/eventRequestModel')
const { normalizeEvent } = require('../models/eventModel')
const conflictService = require('./conflictService')
const imageService = require('./imageService')
const { getDistrictFromCoords } = require('./geocodingService')

async function getEventRequests(currentUserId) {
  const requests = await eventRequestRepository.getEventRequests()
  if (currentUserId) return requests.filter(request => request.organizerId !== currentUserId)
  return requests
}
async function getUserEventRequests(userId) { return eventRequestRepository.getUserEventRequests(userId) }
async function getEventRequestById(requestId) { return eventRequestRepository.getEventRequestById(requestId) }

async function createEventRequest(input, userId) {
  if (input.imageUrl && input.imageUrl.startsWith('data:image')) input.imageUrl = await imageService.uploadImage(input.imageUrl)
  const request = validateEventRequestForCreation(input, userId)
  if (request.latitude && request.longitude && !request.district) request.district = await getDistrictFromCoords(request.latitude, request.longitude) || ''
  return eventRequestRepository.createEventRequest(request)
}

async function updateEventRequest(requestId, input, userId) {
  const existing = await assertOrganizer(requestId, userId)
  if (existing.status === 'CONFIRMED' || existing.eventId) throw Object.assign(new Error('Cannot edit a request that has already been confirmed.'), { statusCode: 400 })
  const updates = {
    title: input.title || existing.title,
    description: input.description || existing.description,
    category: input.category || existing.category,
    city: input.city || existing.city,
    neighborhood: input.neighborhood || existing.neighborhood,
    location: input.location || existing.location,
    district: input.district || existing.district,
    startTime: Number(input.startTime) || existing.startTime,
    endTime: Number(input.endTime) || existing.endTime,
    demandThreshold: Number(input.demandThreshold) || existing.demandThreshold,
  }
  if (input.latitude && input.longitude && (input.latitude !== existing.latitude || input.longitude !== existing.longitude || !existing.district)) updates.district = await getDistrictFromCoords(input.latitude, input.longitude) || ''
  if (input.imageUrl && input.imageUrl !== existing.imageUrl) updates.imageUrl = input.imageUrl.startsWith('data:image') ? await imageService.uploadImage(input.imageUrl) : input.imageUrl
  return eventRequestRepository.updateEventRequest(requestId, updates)
}

async function deleteEventRequest(requestId, userId) {
  const existing = await assertOrganizer(requestId, userId)
  if (existing.status === 'CONFIRMED' || existing.eventId) throw Object.assign(new Error('Cannot delete a request that has already been confirmed.'), { statusCode: 400 })
  return eventRequestRepository.deleteEventRequest(requestId)
}

async function getInterestStatus(requestId, userId) { return eventRequestRepository.hasUserExpressedInterest(requestId, userId) }
async function expressInterest(requestId, userId) { return eventRequestRepository.expressInterest(requestId, userId) }
async function removeInterest(requestId, userId) { return eventRequestRepository.removeInterest(requestId, userId) }

function requestToConflictEvent(request) {
  return normalizeEvent({ eventId: '', title: request.title, description: request.description, category: request.category, city: request.city, neighborhood: request.neighborhood, location: request.location, startTime: request.startTime, endTime: request.endTime, status: 'PUBLISHED', rsvpCount: 0, organizerId: request.organizerId, createdAt: request.createdAt, expireAt: request.endTime, conflictStatus: 'NONE', imageUrl: request.imageUrl || '' })
}

async function confirmEventRequest(requestId, userId) {
  const request = await assertOrganizer(requestId, userId)
  if (request.status !== 'THRESHOLD_REACHED') throw Object.assign(new Error('Event request must reach the demand threshold before confirmation'), { statusCode: 409 })
  const conflicts = await conflictService.checkConflicts(requestToConflictEvent(request))
  if (conflicts.length > 0) throw Object.assign(new Error('Potential event conflict detected'), { statusCode: 409, conflicts })
  return eventRequestRepository.confirmEventRequest(requestId)
}

async function confirmEventRequestAnyway(requestId, userId) {
  const request = await assertOrganizer(requestId, userId)
  if (request.status !== 'THRESHOLD_REACHED') throw Object.assign(new Error('Event request must reach the demand threshold before confirmation'), { statusCode: 409 })
  return eventRequestRepository.confirmEventRequest(requestId)
}

async function declineEventRequest(requestId, userId) {
  const request = await assertOrganizer(requestId, userId)
  if (request.status !== 'THRESHOLD_REACHED') throw Object.assign(new Error('Event request must reach the demand threshold before decline'), { statusCode: 409 })
  await eventRequestRepository.declineEventRequest(requestId)
  return { requestId, status: 'DECLINED' }
}

async function assertOrganizer(requestId, userId) {
  const request = await eventRequestRepository.getEventRequestById(requestId)
  if (!request) throw Object.assign(new Error('Event request not found'), { statusCode: 404 })
  if (request.organizerId !== userId) throw Object.assign(new Error('You are not authorized to perform this action.'), { statusCode: 403 })
  return request
}

module.exports = { getEventRequests, getUserEventRequests, getEventRequestById, createEventRequest, updateEventRequest, deleteEventRequest, getInterestStatus, expressInterest, removeInterest, confirmEventRequest, confirmEventRequestAnyway, declineEventRequest }
