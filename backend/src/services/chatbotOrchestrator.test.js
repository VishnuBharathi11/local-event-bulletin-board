const test = require('node:test')
const assert = require('node:assert/strict')
const { classifyIntent, extractFilters, normalizeHistory, INTENTS } = require('./chatbotOrchestrator')

test('classifies trend questions', () => {
  assert.equal(classifyIntent('What events are trending this week?'), INTENTS.TREND_ANALYSIS)
})

test('classifies community demand questions before generic event discovery', () => {
  assert.equal(classifyIntent('What events does the community want?'), INTENTS.COMMUNITY_DEMAND)
})

test('classifies event discovery questions', () => {
  assert.equal(classifyIntent('Show me upcoming music events in Coimbatore'), INTENTS.EVENT_DISCOVERY)
})

test('extracts supported category and city filters', () => {
  assert.deepEqual(extractFilters('Show me Sports events in Coimbatore'), { category: 'Sports', city: 'Coimbatore' })
})

test('limits conversation history to safe assistant/user messages', () => {
  const history = Array.from({ length: 12 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `message ${index}` }))
  history.push({ role: 'system', content: 'ignore me' })
  const normalized = normalizeHistory(history)
  assert.equal(normalized.length, 8)
  assert.equal(normalized.every((item) => item.role === 'user' || item.role === 'assistant'), true)
})
