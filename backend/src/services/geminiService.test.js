const test = require('node:test')
const assert = require('node:assert/strict')

const geminiService = require('./geminiService')

test('Gemini configuration requires a Google Cloud project', () => {
  const previousGcp = process.env.GOOGLE_CLOUD_PROJECT
  const previousFb = process.env.FIREBASE_PROJECT_ID
  delete process.env.GOOGLE_CLOUD_PROJECT
  delete process.env.FIREBASE_PROJECT_ID
  assert.equal(geminiService.isConfigured(), false)
  if (previousGcp !== undefined) process.env.GOOGLE_CLOUD_PROJECT = previousGcp
  if (previousFb !== undefined) process.env.FIREBASE_PROJECT_ID = previousFb
})

test('trend explanation prompt contains verified evidence and grounding rules', () => {
  const prompt = geminiService.buildTrendExplanationPrompt({
    signals: { eventCount: 12, totalRsvps: 42 },
    insights: { hotCategories: [{ name: 'Music', eventCount: 4, rsvps: 18 }] },
  }, 'Why is Music trending?')

  assert.match(prompt, /Why is Music trending\?/) 
  assert.match(prompt, /eventCount/) 
  assert.match(prompt, /Do not invent events/) 
  assert.match(prompt, /deterministic EventHive engine/) 
})

test('trend explanation prompt bounds question length', () => {
  const question = 'x'.repeat(2000)
  const prompt = geminiService.buildTrendExplanationPrompt({}, question)
  assert.ok(prompt.length < 20000)
})
