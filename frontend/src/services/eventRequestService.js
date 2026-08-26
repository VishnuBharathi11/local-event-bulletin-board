import { apiRequest } from './apiClient.js'

export function getEventRequests() {
  return apiRequest('/event-requests')
}

export function getMyEventRequests() {
  return apiRequest('/event-requests/mine')
}

export const getUserEventRequests = getMyEventRequests

export function getEventRequestById(requestId) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}`)
}

export function createEventRequest(request) {
  return apiRequest('/event-requests', { method: 'POST', body: JSON.stringify(request) })
}

export function updateEventRequest(requestId, updates) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}`, { method: 'PATCH', body: JSON.stringify(updates) })
}

export function deleteEventRequest(requestId) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}`, { method: 'DELETE' })
}

export function getInterestStatus(requestId) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}/interest`)
}

export function expressInterest(requestId) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}/interest`, { method: 'POST' })
}

export function confirmEventRequest(requestId) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}/confirm`, { method: 'POST' })
}

export function confirmEventRequestAnyway(requestId) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}/confirm-anyway`, { method: 'POST' })
}

export function declineEventRequest(requestId) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}/decline`, { method: 'POST' })
}
