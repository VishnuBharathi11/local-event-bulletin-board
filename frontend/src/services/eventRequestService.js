import { apiRequest } from './apiClient.js'

export function getEventRequests() {
  return apiRequest('/event-requests')
}

export function getEventRequestById(requestId) {
  return apiRequest(`/event-requests/${encodeURIComponent(requestId)}`)
}

export function createEventRequest(request) {
  return apiRequest('/event-requests', { method: 'POST', body: JSON.stringify(request) })
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
