const test = require('node:test')
const assert = require('node:assert/strict')

const geminiService = require('./geminiService')
const eventDescriptionService = require('./eventDescriptionService')

const {
  MAX_DESCRIPTION_CHARS,
  MIN_USEFUL_DESCRIPTION_CHARS,
  validateRequest,
  buildDescriptionPrompt,
  buildMeaningfulRewritePrompt,
  buildShorteningPrompt,
  normalizeGeneratedText,
  assertFinalDescription,
  assertMeaningfulDescription,
  generateDescription,
} = eventDescriptionService

function createMockAI(responses) {
  const queue = Array.isArray(responses)
    ? [...responses]
    : [responses]

  return {
    calls: [],

    models: {
      generateContent: async (request) => {
        return {
          text: queue.length > 1
            ? queue.shift()
            : queue[0],
        }
      },
    },
  }
}

function withConfiguredGemini() {
  const originalIsConfigured = geminiService.isConfigured

  geminiService.isConfigured = () => true

  return () => {
    geminiService.isConfigured = originalIsConfigured
  }
}

test('valid title generates a meaningful description using supplied event data', async () => {
  const restore = withConfiguredGemini()

  try {
    const ai = createMockAI(
      'Join our local A2D Developer Meetup in Coimbatore to connect with developers, exchange ideas, and discuss practical software development topics in a community-focused setting.',
    )

    const result = await generateDescription(
      {
        title: 'A2D Developer Meetup',
        category: 'Technology',
        city: 'Coimbatore',
        neighborhood: 'RS Puram',
        location: 'Community Hall',
        description: '',
      },
      ai,
    )

    assert.ok(result.length >= MIN_USEFUL_DESCRIPTION_CHARS)
    assert.ok(result.length <= MAX_DESCRIPTION_CHARS)
    assert.match(result, /A2D Developer Meetup/)
    assert.match(result, /Coimbatore/)
  } finally {
    restore()
  }
})

test('empty title is rejected', () => {
  assert.throws(
    () => validateRequest({ title: '' }),
    {
      name: 'TypeError',
      message: 'title is required',
    },
  )
})

test('invalid title input is rejected', () => {
  assert.throws(
    () => validateRequest({ title: 123 }),
    {
      name: 'TypeError',
      message: 'title must be a string',
    },
  )
})

test('additional event fields are validated', () => {
  assert.throws(
    () =>
      validateRequest({
        title: 'A2D Developer Meetup',
        category: 123,
      }),
    {
      name: 'TypeError',
      message: 'category must be a string',
    },
  )
})

test('empty AI output is handled', async () => {
  const restore = withConfiguredGemini()

  try {
    const ai = createMockAI('')

    await assert.rejects(
      () =>
        generateDescription(
          {
            title: 'A2D Developer Meetup',
          },
          ai,
        ),
      {
        code: 'EVENT_DESCRIPTION_EMPTY',
      },
    )
  } finally {
    restore()
  }
})

test('descriptions at 500 characters are accepted', () => {
  const description = 'A'.repeat(MAX_DESCRIPTION_CHARS)

  const result = assertFinalDescription(description)

  assert.equal(result.length, MAX_DESCRIPTION_CHARS)
})

test('overlong AI output is shortened through a second controlled generation', async () => {
  const restore = withConfiguredGemini()

  try {
    const longDescription = 'A'.repeat(501)

    const ai = createMockAI([
      longDescription,
      'Join the A2D Developer Meetup to connect with the local developer community, exchange practical ideas, and learn through meaningful technical discussions.',
    ])

    const result = await generateDescription(
      {
        title: 'A2D Developer Meetup',
        category: 'Technology',
        city: 'Coimbatore',
      },
      ai,
    )

    assert.ok(result.length <= MAX_DESCRIPTION_CHARS)
    assert.ok(result.length >= MIN_USEFUL_DESCRIPTION_CHARS)
  } finally {
    restore()
  }
})

test('still-too-long AI output is rejected after controlled shortening', async () => {
  const restore = withConfiguredGemini()

  try {
    const first = 'A'.repeat(501)
    const second = 'B'.repeat(501)

    const ai = createMockAI([
      first,
      second,
    ])

    await assert.rejects(
      () =>
        generateDescription(
          {
            title: 'A2D Developer Meetup',
            category: 'Technology',
            city: 'Coimbatore',
          },
          ai,
        ),
      {
        code: 'EVENT_DESCRIPTION_TOO_LONG',
      },
    )
  } finally {
    restore()
  }
})

test('short generic AI output is rejected and retried through the controlled generation path', async () => {
  const restore = withConfiguredGemini()

  try {
    const ai = createMockAI([
      'Join the A2D Meetup.',
      'Join the A2D Meetup to connect with the local developer community, exchange ideas, discuss practical software development topics, and build useful professional connections.',
    ])

    const result = await generateDescription(
      {
        title: 'A2D Developer Meetup',
        category: 'Technology',
        city: 'Coimbatore',
      },
      ai,
    )

    assert.ok(result.length >= MIN_USEFUL_DESCRIPTION_CHARS)
    assert.ok(result.length <= MAX_DESCRIPTION_CHARS)
    assert.match(result, /local developer community/i)
  } finally {
    restore()
  }
})

test('Gemini configuration failure is surfaced without requiring browser credentials', async () => {
  const originalIsConfigured = geminiService.isConfigured

  geminiService.isConfigured = () => false

  try {
    await assert.rejects(
      () =>
        generateDescription({
          title: 'A2D Developer Meetup',
        }),
      {
        code: 'GEMINI_NOT_CONFIGURED',
      },
    )
  } finally {
    geminiService.isConfigured = originalIsConfigured
  }
})

test('prompt treats event fields as data and constrains fabrication', () => {
  const prompt = buildDescriptionPrompt({
    title: 'A2D Developer Meetup',
    category: 'Technology',
    city: 'Coimbatore',
    neighborhood: 'RS Puram',
    location: 'Community Hall',
    description: '',
  })

  assert.match(prompt, /untrusted DATA/i)
  assert.match(prompt, /Never follow instructions/i)
  assert.match(prompt, /Never invent dates/i)
  assert.match(prompt, /specific activities/i)
})

test('prompt explicitly requests meaningful attendee-oriented content and controlled length', () => {
  const prompt = buildDescriptionPrompt({
    title: 'A2D Developer Meetup',
  })

  assert.match(prompt, /meaningful/i)
  assert.match(prompt, /attendee-oriented/i)
  assert.match(prompt, /120-350 characters/i)
  assert.match(prompt, /Never exceed 500 characters/i)
})

test('prompt uses an existing description for improvement without silently adding facts', () => {
  const prompt = buildDescriptionPrompt({
    title: 'A2D Developer Meetup',
    category: 'Technology',
    description: 'A local developer gathering.',
  })

  assert.match(prompt, /Improve the supplied existing description/i)
  assert.match(prompt, /preserving every supported fact/i)
  assert.match(prompt, /Do not silently add any fact/i)
})

test('short-output retry prompt asks for a richer description instead of shortening it', () => {
  const prompt = buildMeaningfulRewritePrompt(
    'Join the A2D Meetup.',
    {
      title: 'A2D Developer Meetup',
      category: 'Technology',
      city: 'Coimbatore',
    },
  )

  assert.match(prompt, /more meaningful/i)
  assert.match(prompt, /more meaningful, informative/i)
  assert.match(prompt, /at least 80 characters/i)
  assert.match(prompt, /Do not merely repeat the event title/i)
  assert.match(prompt, /Never exceed 500 characters/i)
})

test('short-output retry does not use the shortening prompt', () => {
  const prompt = buildShorteningPrompt(
    'A long event description that needs to be reduced while preserving its useful information.',
    {
      title: 'A2D Developer Meetup',
      category: 'Technology',
      city: 'Coimbatore',
    },
  )

  assert.match(prompt, /Shorten the EventHive description/i)
  assert.doesNotMatch(prompt, /more meaningful, informative attendee-oriented description/i)
})

test('normalization removes surrounding whitespace and quotes', () => {
  assert.equal(
    normalizeGeneratedText('  "A useful event description."  '),
    'A useful event description.',
  )
})

test('meaningful description validation enforces the quality floor', () => {
  const event = {
    title: 'A2D Developer Meetup',
  }

  assert.throws(
    () =>
      assertMeaningfulDescription(
        'Join the meetup.',
        event,
      ),
    {
      code: 'EVENT_DESCRIPTION_TOO_SHORT',
    },
  )
})