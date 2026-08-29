const crypto = require('node:crypto')

const CONTEXT_VERSION = 'phase4.3-context-v2'
const MAX_HISTORY_TURNS = 8
const MAX_MESSAGE_CHARS = 1000
const MAX_HISTORY_ITEM_CHARS = 1500
const MAX_TOTAL_CONTEXT_CHARS = 6000
const MAX_CONVERSATIONS = 500
const MAX_RESULT_CONTEXT = 10

const conversationStore = new Map()

function createConversationId() { return crypto.randomUUID() }
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return []
  const normalized = history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_HISTORY_ITEM_CHARS) }))
    .filter((item) => item.content)
    .slice(-MAX_HISTORY_TURNS)
  let total = 0
  const bounded = []
  for (const item of normalized.reverse()) {
    if (total + item.content.length > MAX_TOTAL_CONTEXT_CHARS) break
    bounded.unshift(item)
    total += item.content.length
  }
  return bounded
}
function sanitizeMessage(message) {
  if (typeof message !== 'string') throw new TypeError('message must be a string')
  const normalized = message.trim()
  if (!normalized) throw new TypeError('message is required')
  if (normalized.length > MAX_MESSAGE_CHARS) throw new TypeError(`message must not exceed ${MAX_MESSAGE_CHARS} characters`)
  return normalized
}
function buildContextText(history) { return history.map((item) => `[${item.role.toUpperCase()}] ${item.content}`).join('\n') }
function rememberConversationContext(conversationId, metadata = {}) {
  if (typeof conversationId !== 'string' || !conversationId.trim()) return
  if (conversationStore.size >= MAX_CONVERSATIONS && !conversationStore.has(conversationId)) { const oldest = conversationStore.keys().next().value; if (oldest) conversationStore.delete(oldest) }
  const safeResults = Array.isArray(metadata.resultMetadata) ? metadata.resultMetadata.slice(0, MAX_RESULT_CONTEXT).map((item) => ({
    eventId: typeof item.eventId === 'string' ? item.eventId.slice(0, 100) : null,
    title: typeof item.title === 'string' ? item.title.slice(0, 200) : null,
    category: typeof item.category === 'string' ? item.category.slice(0, 100) : null,
    city: typeof item.city === 'string' ? item.city.slice(0, 100) : null,
  })) : []
  conversationStore.set(conversationId, {
    intent: metadata.intent || null,
    tool: metadata.tool || null,
    eventId: typeof metadata.eventId === 'string' ? metadata.eventId.slice(0, 100) : null,
    eventTitle: typeof metadata.eventTitle === 'string' ? metadata.eventTitle.slice(0, 200) : null,
    category: typeof metadata.category === 'string' ? metadata.category.slice(0, 100) : null,
    city: typeof metadata.city === 'string' ? metadata.city.slice(0, 100) : null,
    query: typeof metadata.query === 'string' ? metadata.query.slice(0, MAX_MESSAGE_CHARS) : null,
    resultCount: Number.isInteger(metadata.resultCount) && metadata.resultCount >= 0 ? metadata.resultCount : safeResults.length,
    resultMetadata: safeResults,
    assistantMetadata: metadata.assistantMetadata && typeof metadata.assistantMetadata === 'object' ? {
      grounded: Boolean(metadata.assistantMetadata.grounded),
      clarification: Boolean(metadata.assistantMetadata.clarification),
    } : null,
  })
}
function getConversationContext(conversationId) { if (typeof conversationId !== 'string' || !conversationId.trim()) return null; return conversationStore.get(conversationId.trim()) || null }
function clearConversationContext(conversationId) { if (typeof conversationId === 'string' && conversationId.trim()) conversationStore.delete(conversationId.trim()) }
function resetConversationContextStore() { conversationStore.clear() }
module.exports = { CONTEXT_VERSION, MAX_HISTORY_TURNS, MAX_MESSAGE_CHARS, MAX_HISTORY_ITEM_CHARS, MAX_TOTAL_CONTEXT_CHARS, createConversationId, sanitizeHistory, sanitizeMessage, buildContextText, rememberConversationContext, getConversationContext, clearConversationContext, resetConversationContextStore }
