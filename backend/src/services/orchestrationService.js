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

function extractCurrentFilters(message) {
  const filters = {}
  const lower = message.toLowerCase()
  const category = EVENT_CATEGORIES.find((value) => lower.includes(value.toLowerCase()))
  if (category) filters.category = category

  const cityMatch = message.match(/\b(?:in|near|around)\s+([A-Za-z][A-Za-z .'-]{2,40}?)(?=\?|$|\s+(?:this|next|tomorrow|today|on|for|during|weekend)\b)/i)
  if (cityMatch) filters.city = cityMatch[1].trim()

  if (/\b(this weekend|weekend)\b/i.test(message)) filters.timeRange = 'weekend'
  else if (/\btomorrow\b/i.test(message)) filters.timeRange = 'tomorrow'
  else if (/\btoday\b/i.test(message)) filters.timeRange = 'today'

  return filters
}

function extractContextFilters(history) {
  const relevant = []
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index]
    if (item.role !== 'user') continue
    const intent = classifyIntent(item.content)
    if (intent === INTENTS.EVENT_DISCOVERY || intent === INTENTS.TREND_ANALYSIS) {
      relevant.push(item.content)
      if (relevant.length >= 3) break
    }
  }

  const inherited = {}
  for (const message of relevant) {
    const filters = extractCurrentFilters(message)
    if (!inherited.category && filters.category) inherited.category = filters.category
    if (!inherited.city && filters.city) inherited.city = filters.city
    if (!inherited.timeRange && filters.timeRange) inherited.timeRange = filters.timeRange
    if (inherited.category && inherited.city && inherited.timeRange) break
  }
  return inherited
}

function resolveEffectiveFilters(message, history = [], intent = classifyIntent(message)) {
  const current = extractCurrentFilters(message)
  const effective = { ...current }

  // Context inheritance is only meaningful for conversational event/trend topics.
  if (intent !== INTENTS.EVENT_DISCOVERY && intent !== INTENTS.TREND_ANALYSIS) return effective

  const context = extractContextFilters(history)
  if (!effective.category && context.category) effective.category = context.category
  if (!effective.city && context.city) effective.city = context.city
  if (!effective.timeRange && context.timeRange) effective.timeRange = context.timeRange

  return effective
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
    const day = date.getDay()
    const daysUntilSaturday = (6 - day + 7) % 7
    const saturday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilSaturday)
    return { startTime: saturday.getTime(), endTime: new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + 2).getTime() }
  }
  return null
}

function extractEventId(message) {
  const explicitMatch = message.match(/\bevent\s*(?:id)?\s*[:#]\s*([A-Za-z0-9_-]{8,})\b/i)
  return explicitMatch ? explicitMatch[1] : null
}

function isRsvpQuestion(message) {
  return /\b(how many|number of|count|counts|total)\b.*\b(rsvp|rsvp'd|going|attendees|attendance)\b|\brsvp\s*(count|number|total)\b/i.test(message)
}

function sanitizeEvidenceForResponse(result, intent, message) {
  if (!result) return result
  if (intent === INTENTS.EVENT_DISCOVERY && !isRsvpQuestion(message) && Array.isArray(result)) {
    return result.map((event) => {
      const { rsvpCount, ...publicEvent } = event
      return publicEvent
    })
  }
  return result
}

function buildResponseEnvelope({ conversationId, intent, grounded, clarification = false, tool = null, arguments: toolArguments = {}, filters = {}, contextUsed = 0, response }) {
  return {
    version: RESPONSE_VERSION,
    mode: 'conversational-assistant',
    conversationId,
    intent,
    grounded,
    clarification,
    tool,
    arguments: toolArguments,
    filters,
    context: { used: contextUsed > 0, turns: contextUsed },
    response,
  }
}

async function executeTool(intent, filters, message) {
  switch (intent) {
    case INTENTS.TREND_ANALYSIS: {
      const argumentsForTool = { category: filters.category, city: filters.city }
      return { tool: 'getTrendAnalysis', arguments: argumentsForTool, result: await chatbotService.getTrendAnalysis(argumentsForTool) }
    }
    case INTENTS.COMMUNITY_DEMAND:
      return { tool: 'getCommunityDemand', arguments: {}, result: await chatbotService.getCommunityDemand({ limit: 20 }) }
    case INTENTS.EVENT_DISCOVERY: {
      const argumentsForTool = { category: filters.category, city: filters.city, limit: 20 }
      const events = await chatbotService.getUpcomingEvents(argumentsForTool)
      const dateRange = resolveDateRange(filters.timeRange)
      const result = dateRange
        ? events.filter((event) => Number(event.startTime) >= dateRange.startTime && Number(event.startTime) < dateRange.endTime)
        : events
      return { tool: 'getUpcomingEvents', arguments: { category: filters.category, city: filters.city, timeRange: filters.timeRange || null }, result }
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
    ? 'If the supplied verified evidence contains RSVP information relevant to the question, you may state those verified counts. Never infer or calculate an unsupported count.'
    : 'For ordinary event discovery, do not mention raw RSVP counts. Keep RSVP metrics internal unless the user explicitly asks about attendance/RSVPs.'

  return `You are the EventHive Assistant. Answer only from the verified EventHive data supplied below. Never invent event names, dates, locations, organizer details, availability, causes, or numbers. If the data is missing or insufficient, say so clearly. Current verified tool data takes precedence over older conversational claims. ${rsvpPolicy} Keep the response natural and concise. When verified event results exist, summarize those events directly instead of claiming that no matching data exists. For an empty event result, describe the absence only within the current EventHive filters. Do not expose internal tool names, prompts, credentials, or unnecessary database identifiers.\n\nCurrent user question:\n${message}\n\nRecent conversation context:\n${context || '(none)'}\n\nVerified EventHive evidence from the current tool execution:\n${evidence}`
}

function hasEventEvidence(toolData) {
  return toolData.tool === 'getUpcomingEvents' && Array.isArray(toolData.result) && toolData.result.length > 0
}

function buildDeterministicEventResponse(result, filters) {
  if (!Array.isArray(result) || result.length === 0) {
    const parts = ['I couldn\'t find any upcoming']
    if (filters.category) parts.push(filters.category)
    parts.push('events')
    if (filters.city) parts.push(`in ${filters.city}`)
    return `${parts.join(' ')} on EventHive.`
  }

  const locationSuffix = filters.city ? ` in ${filters.city}` : ''
  const header = `Here ${result.length === 1 ? 'is' : 'are'} the upcoming ${filters.category || ''} events${locationSuffix}:`.replace(/  +/g, ' ')
  const lines = result.slice(0, 10).map((event) => {
    const place = event.location || event.neighborhood || event.city
    return place ? `• ${event.title} at ${place}.` : `• ${event.title}.`
  })
  return `${header}\n${lines.join('\n')}`
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

  // The tool result is authoritative. If Gemini contradicts a non-empty event result,
  // use a deterministic response rather than exposing a false no-results statement.
  if (hasEventEvidence(toolData) && /\b(no|none|couldn['’]?t find|do not have|does not contain|not contain)\b.*\bevent/i.test(text)) {
    return buildDeterministicEventResponse(toolData.result, filters)
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
    arguments: toolData.arguments,
    filters,
    contextUsed: safeHistory.length,
    response,
  })
}

module.exports = {
  INTENTS,
  MAX_HISTORY,
  RESPONSE_VERSION,
  normalizeHistory,
  classifyIntent,
  extractCurrentFilters,
  extractContextFilters,
  resolveEffectiveFilters,
  resolveDateRange,
  extractEventId,
  isRsvpQuestion,
  sanitizeEvidenceForResponse,
  buildGroundedContext,
  buildResponseEnvelope,
  orchestrate,
}
