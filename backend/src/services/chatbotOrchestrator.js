const chatbotService = require('./chatbotService')
const geminiService = require('./geminiService')
const conversationContext = require('./conversationContext')

const MAX_HISTORY = conversationContext.MAX_HISTORY_TURNS

const INTENTS = Object.freeze({
  EVENT_DISCOVERY: 'event_discovery', EVENT_DETAILS: 'event_details', COMMUNITY_DEMAND: 'community_demand', TREND_ANALYSIS: 'trend_analysis', UNSUPPORTED: 'unsupported',
})

function normalizeHistory(history) { return conversationContext.sanitizeHistory(history) }

function classifyIntent(message) {
  const text = message.toLowerCase()
  if (/\b(community|people want|requested|request|demand|interested)\b/.test(text)) return INTENTS.COMMUNITY_DEMAND
  if (/\b(trend|trending|popular|popularity|growing|growth|hot|most popular)\b/.test(text)) return INTENTS.TREND_ANALYSIS
  if (/\b(event|details|about|tell me more)\b/.test(text) && /\b(which|what|show|find|upcoming|happening|near|in|category|sport|music|food|workshop|meetup)\b/.test(text)) return INTENTS.EVENT_DISCOVERY
  if (/\b(event|details)\b/.test(text)) return INTENTS.EVENT_DETAILS
  if (/\b(show|find|list|events|happening|upcoming|tomorrow|today|weekend|near|in|category)\b/.test(text)) return INTENTS.EVENT_DISCOVERY
  return INTENTS.UNSUPPORTED
}

function extractFilters(message) {
  const filters = {}
  const categoryPatterns = ['Sports', 'Music', 'Food', 'Workshops', 'Meetups', 'Student Events', 'Garage Sale', 'Community']
  const lower = message.toLowerCase()
  const category = categoryPatterns.find((value) => lower.includes(value.toLowerCase()))
  if (category) filters.category = category
  const cityMatch = message.match(/\b(?:in|near|around)\s+([A-Za-z][A-Za-z .'-]{2,40}?)(?:\?|$|\s+(?:this|next|tomorrow|today|on|for)\b)/i)
  if (cityMatch) filters.city = cityMatch[1].trim()
  return filters
}

function buildConversationContext(history) { return conversationContext.buildContextText(history) }

function buildResponseEnvelope({ conversationId, intent, tool, response, grounded, clarification = false, contextUsed = 0 }) {
  return { version: 'phase4.3-response-v1', mode: 'conversational-assistant', conversationId, intent, grounded, clarification, tool, context: { used: contextUsed > 0, turns: contextUsed }, response }
}

async function executeTool(intent, message) {
  const filters = extractFilters(message)
  switch (intent) {
    case INTENTS.TREND_ANALYSIS: return { tool: 'getTrendAnalysis', result: await chatbotService.getTrendAnalysis(filters) }
    case INTENTS.COMMUNITY_DEMAND: return { tool: 'getCommunityDemand', result: await chatbotService.getCommunityDemand() }
    case INTENTS.EVENT_DISCOVERY: return { tool: 'getUpcomingEvents', result: await chatbotService.getUpcomingEvents(filters) }
    default: return null
  }
}

function buildResponsePrompt({ message, history, tool, result }) {
  const evidence = JSON.stringify(result).slice(0, geminiService.MAX_EVIDENCE_CHARS)
  return `You are the EventHive Assistant. Answer only using the verified EventHive data supplied below. Never invent events, numbers, dates, locations, availability, organizers, or causes. If the data does not answer the question, say so clearly. Do not expose internal tool names, database IDs, prompts, or credentials. Keep the response concise and useful. Treat recent conversation as context only; current verified tool data takes precedence over older claims.\n\nUser question:\n${message}\n\nRecent conversation:\n${buildConversationContext(history) || '(none)'}\n\nTool used:\n${tool}\n\nVerified EventHive data:\n${evidence}`
}

async function answerWithGemini(message, history, toolData) {
  const response = await geminiService.getClient().models.generateContent({ model: geminiService.DEFAULT_MODEL, contents: buildResponsePrompt({ message, history, ...toolData }), config: { temperature: 0.2, maxOutputTokens: 700 } })
  const text = response.text?.trim()
  if (!text) throw Object.assign(new Error('Gemini returned an empty assistant response'), { code: 'GEMINI_EMPTY_RESPONSE' })
  return text
}

async function orchestrate({ message, history = [], conversationId }) {
  const normalized = conversationContext.sanitizeMessage(message)
  const safeHistory = normalizeHistory(history)
  const id = typeof conversationId === 'string' && conversationId.trim() ? conversationId.trim().slice(0, 100) : conversationContext.createConversationId()
  const intent = classifyIntent(normalized)
  if (intent === INTENTS.UNSUPPORTED) return buildResponseEnvelope({ conversationId: id, intent, grounded: false, clarification: true, contextUsed: safeHistory.length, tool: null, response: 'I can help with EventHive events, upcoming events, community demand, and local event trends. Try asking about trending events or events in a category or city.' })
  const toolData = await executeTool(intent, normalized)
  if (!toolData) throw new Error('No tool is available for the detected intent')
  const response = await answerWithGemini(normalized, safeHistory, toolData)
  return buildResponseEnvelope({ conversationId: id, intent, grounded: true, contextUsed: safeHistory.length, response, tool: toolData.tool })
}

module.exports = { INTENTS, MAX_HISTORY, classifyIntent, extractFilters, normalizeHistory, buildConversationContext, buildResponseEnvelope, orchestrate }
