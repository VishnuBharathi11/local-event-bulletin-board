const eventRepository = require('../repositories/eventRepository')
const eventRequestRepository = require('../repositories/eventRequestRepository')
const { normalizeEvent } = require('../models/eventModel')
const trendService = require('./trendService')
const aiIntelligenceService = require('./aiIntelligenceService')

const CHATBOT_VERSION = 'phase5.6-unified-intelligence-v1'

const CHATBOT_TOOLS = Object.freeze([
  { name: 'getUpcomingEvents', description: 'Return upcoming non-expired EventHive events, optionally filtered by category or city.', readOnly: true },
  { name: 'getEventDetails', description: 'Return details for a specific EventHive event.', readOnly: true },
  { name: 'getCommunityDemand', description: 'Return active community event requests and their current demand.', readOnly: true },
  { name: 'getTrendAnalysis', description: 'Return deterministic EventHive trend metrics derived from event activity, RSVP velocity, category/location activity, and community demand.', readOnly: true },
  { name: 'semanticEventSearch', description: 'Find EventHive events using semantic similarity over existing event embeddings.', readOnly: true },
  { name: 'similarEventsForEvent', description: 'Find semantically similar EventHive events for an identified event.', readOnly: true },
  { name: 'semanticTrendAnalysis', description: 'Group existing embedded EventHive events into meaningful semantic trend clusters.', readOnly: true },
])

function validateMessage(message) {
  if (typeof message !== 'string') throw new TypeError('message must be a string')
  const normalized = message.trim()
  if (!normalized) throw new TypeError('message is required')
  if (normalized.length > 1000) throw new TypeError('message must not exceed 1000 characters')
  return normalized
}

function serializeEvent(event) {
  const normalized = normalizeEvent(event)
  return { eventId: normalized.eventId, title: normalized.title, description: normalized.description, category: normalized.category, city: normalized.city, neighborhood: normalized.neighborhood, location: normalized.location, startTime: normalized.startTime, endTime: normalized.endTime, status: normalized.status, rsvpCount: normalized.rsvpCount, organizerId: normalized.organizerId, imageUrl: normalized.imageUrl, latitude: normalized.latitude, longitude: normalized.longitude }
}

async function getUpcomingEvents({ category, city, limit = 10 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20)
  const now = Date.now()
  let events = await eventRepository.getActiveEvents(now)
  events = events.filter((event) => Number(event.startTime) > now)
  if (category) events = events.filter((event) => event.category.toLowerCase() === String(category).trim().toLowerCase())
  if (city) events = events.filter((event) => event.city.toLowerCase() === String(city).trim().toLowerCase())
  return events.slice(0, safeLimit).map(serializeEvent)
}

async function getEventDetails(eventId) {
  if (typeof eventId !== 'string' || !eventId.trim()) throw new TypeError('eventId is required')
  const event = await eventRepository.getEventById(eventId.trim())
  return event ? serializeEvent(event) : null
}

async function getCommunityDemand({ limit = 10 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20)
  const requests = await eventRequestRepository.getEventRequests()
  return requests.slice(0, safeLimit).map((request) => ({ requestId: request.requestId, title: request.title, description: request.description, category: request.category, city: request.city, neighborhood: request.neighborhood, demandCount: request.demandCount, demandThreshold: request.demandThreshold, status: request.status, startTime: request.startTime, endTime: request.endTime }))
}

async function getTrendAnalysis(options = {}) { return trendService.analyzeTrends(options) }

function getCapabilities() {
  return {
    version: CHATBOT_VERSION,
    mode: 'unified-ai-intelligence',
    aiEnabled: true,
    readOnly: true,
    tools: CHATBOT_TOOLS,
    supportedIntentGroups: [
      'event_discovery',
      'semantic_event_discovery',
      'similar_event_discovery',
      'event_details',
      'community_demand',
      'trend_analysis',
      'semantic_trend_analysis',
      'semantic_conflict_analysis',
    ],
  }
}

async function processMessage({ message }) { return { version: CHATBOT_VERSION, mode: 'unified-ai-intelligence', status: 'handled_by_orchestrator', message: validateMessage(message) } }

module.exports = {
  CHATBOT_VERSION,
  CHATBOT_TOOLS,
  validateMessage,
  getCapabilities,
  getUpcomingEvents,
  getEventDetails,
  getCommunityDemand,
  getTrendAnalysis,
  semanticEventSearch: aiIntelligenceService.semanticEventSearch,
  similarEventsForEvent: aiIntelligenceService.similarEventsForEvent,
  semanticTrendAnalysis: aiIntelligenceService.semanticTrendAnalysis,
  deterministicAndSemanticTrends: aiIntelligenceService.deterministicAndSemanticTrends,
  semanticConflictAnalysis: aiIntelligenceService.semanticConflictAnalysis,
  processMessage,
}
