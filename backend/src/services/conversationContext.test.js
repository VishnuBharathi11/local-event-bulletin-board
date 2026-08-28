const test = require('node:test')
const assert = require('node:assert/strict')
const context = require('./conversationContext')

test('sanitizeHistory keeps only supported roles and latest bounded turns', () => {
  const history = [
    { role: 'system', content: 'ignore me' },
    ...Array.from({ length: 10 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `message-${index}` })),
  ]
  const result = context.sanitizeHistory(history)
  assert.equal(result.length, 8)
  assert.equal(result[0].content, 'message-2')
  assert.equal(result[7].content, 'message-9')
  assert.ok(result.every((item) => item.role === 'user' || item.role === 'assistant'))
})

test('sanitizeMessage enforces the public request boundary', () => {
  assert.equal(context.sanitizeMessage('  hello  '), 'hello')
  assert.throws(() => context.sanitizeMessage(''), /message is required/)
  assert.throws(() => context.sanitizeMessage('x'.repeat(1001)), /must not exceed 1000/)
})

test('context text uses explicit role labels', () => {
  assert.equal(context.buildContextText([{ role: 'user', content: 'find music' }, { role: 'assistant', content: 'I found events' }]), '[USER] find music\n[ASSISTANT] I found events')
})
