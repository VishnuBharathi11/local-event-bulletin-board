const test = require('node:test')
const assert = require('node:assert/strict')

const semanticDiscoveryController = require('./semanticDiscoveryController')
const semanticEventDiscoveryService = require('../services/semanticEventDiscoveryService')
const chatbotService = require('../services/chatbotService')

test('semanticSearch returns a domain-level semantic discovery response', async () => {
  const original = semanticEventDiscoveryService.searchSemantically
  semanticEventDiscoveryService.searchSemantically = async (query, options) => {
    assert.equal(query, 'football sports activity')
    assert.deepEqual(options, { limit: 5, category: 'Sports', city: 'Coimbatore', distanceMeasure: undefined })
    return [{ eventId: 'football-1', title: 'Football Match', category: 'Sports', city: 'Coimbatore', distance: 0.1, semanticSimilarity: 0.9 }]
  }

  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }

  try {
    await semanticDiscoveryController.semanticSearch({ body: { query: 'football sports activity', limit: 5, category: 'Sports', city: 'Coimbatore' } }, response)
    assert.equal(response.statusCode, 200)
    assert.equal(response.body.mode, 'semantic-event-discovery')
    assert.equal(response.body.results[0].eventId, 'football-1')
  } finally {
    semanticEventDiscoveryService.searchSemantically = original
  }
})

test('similarEvents resolves the source event and returns semantic neighbors', async () => {
  const originalEvent = chatbotService.getEventDetails
  const originalSimilar = semanticEventDiscoveryService.findSimilarToEvent
  chatbotService.getEventDetails = async (eventId) => ({
    eventId,
    title: 'Music Concert',
    description: 'Live performance',
    category: 'Music',
    city: 'Coimbatore',
    neighborhood: 'Sitra',
    location: 'Ground',
  })
  semanticEventDiscoveryService.findSimilarToEvent = async (event, options) => {
    assert.equal(event.eventId, 'music-1')
    assert.deepEqual(options, { limit: '5', category: undefined, city: undefined, distanceMeasure: undefined })
    return [{ eventId: 'music-2', title: 'Music Night', distance: 0.12, semanticSimilarity: 0.88 }]
  }

  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }

  try {
    await semanticDiscoveryController.similarEvents({ params: { eventId: 'music-1' }, query: { limit: '5' } }, response)
    assert.equal(response.statusCode, 200)
    assert.equal(response.body.mode, 'similar-event-discovery')
    assert.equal(response.body.sourceEventId, 'music-1')
    assert.equal(response.body.results[0].eventId, 'music-2')
  } finally {
    chatbotService.getEventDetails = originalEvent
    semanticEventDiscoveryService.findSimilarToEvent = originalSimilar
  }
})
