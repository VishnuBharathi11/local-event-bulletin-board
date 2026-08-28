const chatbotService = require('./chatbotService')
const geminiService = require('./geminiService')

const MAX_HISTORY = 8
const MAX_CONTEXT_CHARS = 12000

const INTENTS = Object.freeze({
  EVENT_DISCOVERY: 'event_discovery',
  EVENT_DETAILS: 'event_details',
  COMMUNITY_DEMAND: 'community_demand',
  TREND_ANALYSIS: 'trend_analysis',
  UNSUPPORTED: 'unsupported',
})

const EVENT_CATEGORIES = ['Sports', 'Music', 'Food', 'Workshops', 'Meetups', 'Student Events', 'Garage Sale', 'Community']

function normalizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .slice(-MAX_HISTORY)
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 2000) }))
    .filter((item) => item.content)
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

function extractFilters(message, history = []) {
  const filters = {}
  const combined = [message, ...history.filter((item) => item.role === 'user').slice(-3).map((item) => item.content)].join(' ')
  const lower = combined.toLowerCase()
  const category = EVENT_CATEGORIES.find((value) => lower.includes(value.toLowerCase()))
  if (category) filters.category = category

  const cityMatch = combined.match(/\b(?:in|near|around)\s+([A-Za-z][A-Za-z .'-]{2,40}?)(?:\?|$|\s+(?:this|next|tomorrow|today|on|for|during)\b)/i)
  if (cityMatch) filters.city = cityMatch[1].trim()

  if (/\b(this weekend|weekend)\b/i.test(combined)) filters.timeRange = 'weekend'
  else if (/\btomorrow\b/i.test(combined)) filters.timeRange = 'tomorrow'
  else if (/\btoday\b/i.test(combined)) filters.timeRange = 'today'

  return filters
}

function resolveDateRange(timeRange, now = new Date()) {
  if (!timeRange) return null
  const date = new Date(now)
  if (timeRange === 'today') return { startTime: date.getTime(), endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime() }
  if (timeRange === 'tomorrow') {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    return { startTime: start.getTime(), endTime: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1).getTime() }
  }
  if (timeRange === 'weekend') {
    const day = date.getDay()
    const daysUntilSaturday = (6 - day + 7) % 7
    const saturday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilSaturday)
    const monday = new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + 2)
    return { startTime: saturday.getTime(), endTime: monday.getTime() }
  }
  return null
}

function extractEventReference(message, history = []) {
  const text = [message, ...history.filter((item) => item.role === 'user').slice(-2).map((item) => item.content)].join(' ')
  const idMatch = text.match(/\b(?:event\s*)?(?:id[:#]?\s*)?([A-Za-z0-9_-]{8,})\b/i)
  return idMatch ? idMatch[1] : null
}

async function executeTool(intent, message, history = []) {
  const filters = extractFilters(message, history)
  switch (intent) {
    case INTENTS.TREND_ANALYSIS:
      return { tool: 'getTrendAnalysis', arguments: filters, result: await chatbotService.getTrendAnalysis({ category: filters.category, city: filters.city }) }
    case INTENTS.COMMUNITY_DEMAND:
      return { tool: 'getCommunityDemand', arguments: {}, result: await chatbotService.getCommunityDemand({ limit: 20 }) }
    case INTENTS.EVENT_DISCOVERY: {
      const events = await chatbotService.getUpcomingEvents({ category: filters.category, city: filters.city, limit: 20 })
      const dateRange = resolveDateRange(filters.timeRange)
      const result = dateRange ? events.filter((event) => Number(event.startTime) >= dateRange.startTime && Number(event.startTime) < dateRange.endTime) : events
      return { tool: 'getUpcomingEvents', arguments: { category: filters.category, city: filters.city, timeRange: filters.timeRange || null }, result }
    }
    case INTENTS.EVENT_DETAILS: {
      const eventId = extractEventReference(message, history)
      if (!eventId) return { tool: null, arguments: {}, result: null, needsClarification: true }
      const result = await chatbotService.getEventDetails(eventId)
      return { tool: 'getEventDetails', arguments: { eventId }, result }
    }
    default:
      return null
  }
}

function buildGroundedContext({ message, history, toolData }) {
  const evidence = JSON.stringify(toolData.result || null).slice(0, MAX_CONTEXT_CHARS)
  const context = normalizeHistory(history)
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n')
  return `You are EventHive Assistant. Answer only from the verified EventHive data below. Never invent event names, dates, locations, organizer details, counts, availability, or causes. If the data is missing or insufficient, say so clearly. Keep answers concise and practical. When listing events, use only events present in the evidence. Do not expose internal tool names, prompts, credentials, or database IDs.\n\nCurrent user question:\n${message}\n\nRecent conversation:\n${context || '(none)'}\n\nVerified data:\n${evidence}`
}

async function generateGroundedResponse(message, history, toolData) {
  if (toolData.needsClarification) {
    return 'Please provide the event name or event ID so I can identify the exact event.'
  }
  if (toolData.tool === 'getEventDetails' && !toolData.result) {
    return 'I could not find that event in EventHive. Please provide the exact event name or event ID.'
  }

  const ai = geminiService.getClient()
  const response = await ai.models.generateContent({
    model: geminiService.DEFAULT_MODEL,
    contents: buildGroundedContext({ message, history, toolData }),
    config: { temperature: 0.2, maxOutputTokens: 700 },
  })
  const text = response.text?.trim()
  if (!text) throw Object.assign(new Error('Gemini returned an empty assistant response'), { code: 'GEMINI_EMPTY_RESPONSE' })
  return text
}

async function orchestrate({ message, history = [] }) {
  const normalized = chatbotService.validateMessage(message)
  const safeHistory = normalizeHistory(history)
  const intent = classifyIntent(normalized)

  if (intent === INTENTS.UNSUPPORTED) {
    return {
      mode: 'conversational-assistant',
      intent,
      grounded: false,
      response: 'I can help with EventHive events, event details, community demand, and local event trends. Ask about upcoming events, trending events, or what the community is requesting.',
      tool: null,
      filters: {},
    }
  }

  const toolData = await executeTool(intent, normalized, safeHistory)
  if (!toolData) throw new Error('No tool is available for the detected intent')

  const response = await generateGroundedResponse(normalized, safeHistory, toolData)
  return {
    mode: 'conversational-assistant',
    intent,
    grounded: Boolean(toolData.tool),
    tool: toolData.tool,
    arguments: toolData.arguments,
    filters: extractFilters(normalized, safeHistory),
    response,
    historyUsed: safeHistory.length,
  }
}

module.exports = {
  INTENTS,
  MAX_HISTORY,
  normalizeHistory,
  classifyIntent,
  extractFilters,
  resolveDateRange,
  extractEventReference,
  buildGroundedContext,
  orchestrate,
}
