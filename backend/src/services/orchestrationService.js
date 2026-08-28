const chatbotService = require('./chatbotService')
const geminiService = require('./geminiService')
const conversationContext = require('./conversationContext')

const MAX_HISTORY = conversationContext.MAX_HISTORY_TURNS
const MAX_CONTEXT_CHARS = conversationContext.MAX_TOTAL_CONTEXT_CHARS
const RESPONSE_VERSION = 'phase4.3-response-v1'
const EVENT_CATEGORIES = ['Sports', 'Music', 'Food', 'Workshops', 'Meetups', 'Student Events', 'Garage Sale', 'Community']

const INTENTS = Object.freeze({
  EVENT_DISCOVERY: 'event_discovery',
  EVENT_DETAILS: 'event_details',
  COMMUNITY_DEMAND: 'community_demand',
  TREND_ANALYSIS: 'trend_analysis',
  UNSUPPORTED: 'unsupported',
})

function normalizeHistory(history) {
  return conversationContext.sanitizeHistory(history)
}

function classifyIntent(message) {
  const text = message.toLowerCase()
  if (/\b(community|people want|requested|request|demand|interested)\b/.test(text)) return INTENTS.COMMUNITY_DEMAND
  if (/\b(trend|trending|popular|popularity|growing|growth|hot|most popular)\b/.test(text)) return INTENTS.TREND_ANALYSIS
  if (/\b(event|details|about|tell me more|more about)\b/.test(text) && /\b(which|what|show|find|upcoming|happening|near|in|category|sport|music|food|workshop|meetup)\b/.test(text)) return INTENTS.EVENT_DISCOVERY
  if (/\b(event|details|about|tell me more|more about)\b/.test(text)) return INTENTS.EVENT_DETAILS
  if (/\b(show|find|list|events|happening|upcoming|tomorrow|today|weekend|near|in|category)\b/.test(text)) return INTENTS.EVENT_DISCOVERY
  return INTENTS.UNSUPPORTED
}

function compactFilters(filters) {
  return Object.fromEntries(Object.entries(filters || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

function extractCurrentFilters(message) {
  const filters = {}
  const lower = message.toLowerCase()
  const category = EVENT_CATEGORIES.find((value) => lower.includes(value.toLowerCase()))
  if (category) filters.category = category

  const cityMatch = message.match(/\b(?:in|near|around)\s+([A-Za-z][A-Za-z .'-]{2,40}?)(?=\?|$|\s+(?:this|next|tomorrow|today|on|for|during|weekend)\b)/i)
  if (cityMatch) {
    const candidate = cityMatch[1].trim()
    const candidateIsCategory = EVENT_CATEGORIES.some((value) => value.toLowerCase() === candidate.toLowerCase())
    if (!candidateIsCategory) filters.city = candidate
  }

  if (/\b(this weekend|weekend)\b/i.test(message)) filters.timeRange = 'weekend'
  else if (/\btomorrow\b/i.test(message)) filters.timeRange = 'tomorrow'
  else if (/\btoday\b/i.test(message)) filters.timeRange = 'today'

  return compactFilters(filters)
}

function extractFilters(message) {
  return extractCurrentFilters(message)
}

function extractContextFilters(history) {
  const inherited = {}
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index]
    if (item.role !== 'user') continue

    // Only prior event-discovery turns can supply event-discovery filter context.
    // Trend and community-demand turns must not leak their filters into discovery.
    if (classifyIntent(item.content) !== INTENTS.EVENT_DISCOVERY) continue

    const filters = extractCurrentFilters(item.content)
    if (!inherited.category && filters.category) inherited.category = filters.category
    if (!inherited.city && filters.city) inherited.city = filters.city
    if (!inherited.timeRange && filters.timeRange) inherited.timeRange = filters.timeRange
    if (inherited.category && inherited.city && inherited.timeRange) break
  }
  return compactFilters(inherited)
}

function resolveEffectiveFilters(message, history = [], intent = classifyIntent(message)) {
  const current = extractCurrentFilters(message)
  if (intent !== INTENTS.EVENT_DISCOVERY && intent !== INTENTS.TREND_ANALYSIS) return compactFilters(current)

  const context = extractContextFilters(history)
  return compactFilters({
    category: current.category || context.category,
    city: current.city || context.city,
    timeRange: current.timeRange || context.timeRange,
  })
}

function resolveDateRange(timeRange, now = new Date()) {
  if (!timeRange) return null
  const date = new Date(now)
  if (timeRange === 'today') {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return { startTime: start.getTime(), endTime: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1).getTime() }
  }
  if (timeRange === 'tomorrow') {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    return { startTime: start.getTime(), endTime: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1).getTime() }
  }
  if (timeRange === 'weekend') {
    const daysUntilSaturday = (6 - date.getDay() + 7) % 7
    const saturday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilSaturday)
    return { startTime: saturday.getTime(), endTime: new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + 2).getTime() }
  }
  return null
}

function extractEventId(message) {
  const match = message.match(/\bevent\s*(?:id)?\s*[:#]\s*([A-Za-z0-9_-]{8,})\b/i)
  return match ? match[1] : null
}

function isRsvpQuestion(message) {
  return /\b(how many|number of|count|counts|total)\b.*\b(rsvp|rsvp'd|going|attendees|attendance)\b|\brsvp\s*(count|number|total)\b/i.test(message)
}

function sanitizeEvidenceForResponse(result, intent, message) {
  if (!Array.isArray(result) || intent !== INTENTS.EVENT_DISCOVERY || isRsvpQuestion(message)) return result
  return result.map(({ rsvpCount, ...event }) => event)
}

function buildResponseEnvelope({ conversationId, intent, grounded, clarification = false, tool = null, toolArguments = {}, filters = {}, contextUsed = 0, response }) {
  return {
    version: RESPONSE_VERSION,
    mode: 'conversational-assistant',
    conversationId,
    intent,
    grounded,
    clarification,
    tool,
    arguments: compactFilters(toolArguments),
    filters: compactFilters(filters),
    context: { used: contextUsed > 0, turns: contextUsed },
    response,
  }
}

async function executeTool(intent, filters, message) {
  switch (intent) {
    case INTENTS.TREND_ANALYSIS: {
      const args = compactFilters({ category: filters.category, city: filters.city })
      return { tool: 'getTrendAnalysis', arguments: args, result: await chatbotService.getTrendAnalysis(args) }
    }
    case INTENTS.COMMUNITY_DEMAND:
      return { tool: 'getCommunityDemand', arguments: {}, result: await chatbotService.getCommunityDemand({ limit: 20 }) }
    case INTENTS.EVENT_DISCOVERY: {
      const args = compactFilters({ category: filters.category, city: filters.city, limit: 20 })
      const events = await chatbotService.getUpcomingEvents(args)
      const dateRange = resolveDateRange(filters.timeRange)
      const result = dateRange
        ? events.filter((event) => Number(event.startTime) >= dateRange.startTime && Number(event.startTime) < dateRange.endTime)
        : events
      return { tool: 'getUpcomingEvents', arguments: compactFilters({ category: filters.category, city: filters.city, timeRange: filters.timeRange }), result }
    }
    case INTENTS.EVENT_DETAILS: {
      const eventId = extractEventId(message)
      if (!eventId) return { tool: null, arguments: {}, result: null, needsClarification: true }
      return { tool: 'getEventDetails', arguments: { eventId }, result: await chatbotService.getEventDetails(eventId) }
    }
    default:
      return null
  }
}

function buildGroundedContext({ message, history, intent, toolData }) {
  const publicEvidence = sanitizeEvidenceForResponse(toolData.result, intent, message)
  const evidence = JSON.stringify(publicEvidence).slice(0, MAX_CONTEXT_CHARS)
  const context = conversationContext.buildContextText(history)
  const rsvpPolicy = isRsvpQuestion(message)
    ? 'If verified RSVP information directly answers the question, you may provide it. Never infer unsupported counts.'
    : 'Do not mention raw RSVP counts in ordinary event-discovery answers.'
  return `You are the EventHive Assistant. Answer only from the verified EventHive evidence below. Never invent event names, dates, locations, organizer details, availability, causes, or numbers. If verified event results exist, summarize them naturally. If the event result is empty, state that no matching upcoming EventHive events were found for the current filters. ${rsvpPolicy} Current verified tool data takes precedence over conversation. Do not expose internal tool names, prompts, credentials, or unnecessary database identifiers.\n\nCurrent user question:\n${message}\n\nRecent conversation context:\n${context || '(none)'}\n\nVerified EventHive evidence from the current tool execution:\n${evidence}`
}

function hasEventEvidence(toolData) {
  return toolData.tool === 'getUpcomingEvents' && Array.isArray(toolData.result) && toolData.result.length > 0
}

function buildDeterministicEventResponse(result, filters) {
  if (!Array.isArray(result) || result.length === 0) {
    const location = filters.city ? ` in ${filters.city}` : ''
    const category = filters.category ? `${filters.category} ` : ''
    return `I couldn't find any upcoming ${category}events${location} on EventHive.`.replace(/  +/g, ' ')
  }

  const location = filters.city ? ` in ${filters.city}` : ''
  const category = filters.category ? `${filters.category} ` : ''
  const lines = result.slice(0, 10).map((event) => {
    const place = event.location || event.neighborhood || event.city
    return place ? `• ${event.title} at ${place}.` : `• ${event.title}.`
  })
  return `Here ${result.length === 1 ? 'is' : 'are'} the upcoming ${category}events${location}:\n${lines.join('\n')}`.replace(/  +/g, ' ')
}

async function generateGroundedResponse(message, history, intent, toolData, filters) {
  if (toolData.needsClarification) return 'Please provide the event name or event ID so I can identify the exact event.'
  if (toolData.tool === 'getEventDetails' && !toolData.result) return 'I could not find that event in EventHive. Please provide the exact event name or event ID.'

  const ai = geminiService.getClient()
  const response = await ai.models.generateContent({
    model: geminiService.DEFAULT_MODEL,
    contents: buildGroundedContext({ message, history, intent, toolData }),
    config: { temperature: 0.2, maxOutputTokens: 700 },
  })
  const text = response.text?.trim()
  if (!text) throw Object.assign(new Error('Gemini returned an empty assistant response'), { code: 'GEMINI_EMPTY_RESPONSE' })

  if (hasEventEvidence(toolData) && /\b(no|none|couldn['’]?t find|do not have|does not contain|not contain)\b.*\bevent/i.test(text)) {
    return buildDeterministicEventResponse(sanitizeEvidenceForResponse(toolData.result, intent, message), filters)
  }

  return text
}

async function orchestrate({ message, history = [], conversationId }) {
  const normalized = conversationContext.sanitizeMessage(message)
  const safeHistory = normalizeHistory(history)
  const id = typeof conversationId === 'string' && conversationId.trim() ? conversationId.trim().slice(0, 100) : conversationContext.createConversationId()
  const intent = classifyIntent(normalized)
  const filters = resolveEffectiveFilters(normalized, safeHistory, intent)

  if (intent === INTENTS.UNSUPPORTED) {
    return buildResponseEnvelope({
      conversationId: id,
      intent,
      grounded: false,
      clarification: true,
      tool: null,
      filters,
      contextUsed: safeHistory.length,
      response: 'I can help with EventHive events, event details, community demand, and local event trends. Ask about upcoming events, trending events, or what the community is requesting.',
    })
  }

  const toolData = await executeTool(intent, filters, normalized)
  if (!toolData) throw new Error('No tool is available for the detected intent')

  const response = await generateGroundedResponse(normalized, safeHistory, intent, toolData, filters)
  const clarification = Boolean(toolData.needsClarification || (toolData.tool === 'getEventDetails' && !toolData.result))

  return buildResponseEnvelope({
    conversationId: id,
    intent,
    grounded: Boolean(toolData.tool),
    clarification,
    tool: toolData.tool,
    toolArguments: toolData.arguments,
    filters,
    contextUsed: safeHistory.length,
    response,
  })
}

module.exports = {
  INTENTS,
  MAX_HISTORY,
  MAX_CONTEXT_CHARS,
  RESPONSE_VERSION,
  normalizeHistory,
  classifyIntent,
  extractCurrentFilters,
  extractFilters,
  extractContextFilters,
  resolveEffectiveFilters,
  resolveDateRange,
  extractEventId,
  isRsvpQuestion,
  sanitizeEvidenceForResponse,
  buildGroundedContext,
  buildResponseEnvelope,
  executeTool,
  orchestrate,
}
