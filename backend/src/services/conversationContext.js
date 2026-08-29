const crypto = require('node:crypto')

const CONTEXT_VERSION = 'phase4.3-context-v1'
const MAX_HISTORY_TURNS = 8
const MAX_MESSAGE_CHARS = 1000
const MAX_HISTORY_ITEM_CHARS = 1500
const MAX_TOTAL_CONTEXT_CHARS = 6000

function createConversationId() {
  return crypto.randomUUID()
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return []

  const normalized = history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_HISTORY_ITEM_CHARS),
    }))
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

function buildContextText(history) {
  return history.map((item) => `[${item.role.toUpperCase()}] ${item.content}`).join('\n')
}

module.exports = { CONTEXT_VERSION, MAX_HISTORY_TURNS, MAX_MESSAGE_CHARS, MAX_HISTORY_ITEM_CHARS, MAX_TOTAL_CONTEXT_CHARS, createConversationId, sanitizeHistory, sanitizeMessage, buildContextText }
