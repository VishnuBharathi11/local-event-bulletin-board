const test = require('node:test')
const assert = require('node:assert/strict')

const {
  normalizeQuery,
  normalizePlaceResult,
  deduplicateSuggestions,
  searchLocations,
} = require('./locationSearchService')

test('valid location search normalizes provider suggestions', async () => {
  let requestedUrl = ''

  const results = await searchLocations('Brookfield', {
    fetcher: async (url) => {
      requestedUrl = url
      return {
        status: 'OK',
        results: [
          {
            name: 'Brookfield Mall',
            formatted_address: 'Avinashi Road, Coimbatore, Tamil Nadu, India',
            geometry: { location: { lat: 11.0168, lng: 76.9558 } },
            address_components: [
              { long_name: 'Coimbatore', types: ['locality'] },
              { long_name: 'Avinashi Road', types: ['sublocality'] },
            ],
          },
        ],
      }
    },
  })

  assert.match(requestedUrl, /maps\.googleapis\.com\/maps\/api\/place\/textsearch\/json/)
  assert.equal(results.length, 1)
  assert.deepEqual(results[0], {
    venue: 'Brookfield Mall',
    address: 'Avinashi Road, Coimbatore, Tamil Nadu, India',
    city: 'Coimbatore',
    neighborhood: 'Avinashi Road',
    latitude: 11.0168,
    longitude: 76.9558,
  })
})

test('empty query is rejected', () => {
  assert.throws(() => normalizeQuery(''), /at least 2 characters/)
})

test('short query is rejected', () => {
  assert.throws(() => normalizeQuery('a'), /at least 2 characters/)
})

test('oversized query is rejected', () => {
  assert.throws(() => normalizeQuery('x'.repeat(101)), /must not exceed 100 characters/)
})

test('provider result normalization tolerates missing optional address fields', () => {
  assert.deepEqual(
    normalizePlaceResult({
      name: 'Community Hall',
      formatted_address: 'RS Puram, Coimbatore',
      geometry: { location: { lat: 11.01, lng: 76.95 } },
      address_components: [],
    }),
    {
      venue: 'Community Hall',
      address: 'RS Puram, Coimbatore',
      city: '',
      neighborhood: '',
      latitude: 11.01,
      longitude: 76.95,
    }
  )
})

test('missing city and neighborhood remain empty rather than invented', () => {
  const result = normalizePlaceResult({
    name: 'Venue',
    formatted_address: 'Some address',
    geometry: { location: { lat: 11, lng: 76 } },
    address_components: [
      { long_name: 'Tamil Nadu', types: ['administrative_area_level_1'] },
    ],
  })

  assert.equal(result.city, '')
  assert.equal(result.neighborhood, '')
})

test('malformed provider results are ignored', () => {
  const normalized = [
    normalizePlaceResult(null),
    normalizePlaceResult({ name: 'No coordinates' }),
    normalizePlaceResult({ name: '', formatted_address: '', geometry: { location: { lat: 11, lng: 76 } } }),
  ]

  assert.deepEqual(normalized, [null, null, null])
})

test('duplicate results are removed deterministically', () => {
  const suggestions = [
    { venue: 'Venue', address: 'Address', city: 'Coimbatore' },
    { venue: 'venue', address: 'address', city: 'coimbatore' },
    { venue: 'Other', address: 'Address 2', city: 'Coimbatore' },
  ]

  assert.deepEqual(deduplicateSuggestions(suggestions), [
    suggestions[0],
    suggestions[2],
  ])
})

test('provider failure is surfaced without leaking provider internals', async () => {
  await assert.rejects(
    searchLocations('Brookfield', {
      fetcher: async () => ({ status: 'REQUEST_DENIED' }),
    }),
    (error) => error.code === 'LOCATION_PROVIDER_ERROR' && error.message === 'Location provider could not complete the search.'
  )
})

test('provider configuration failure is explicit', async () => {
  const previousPlacesKey = process.env.GOOGLE_PLACES_API_KEY
  const previousGeocodingKey = process.env.GOOGLE_GEOCODING_API_KEY

  delete process.env.GOOGLE_PLACES_API_KEY
  delete process.env.GOOGLE_GEOCODING_API_KEY

  try {
    await assert.rejects(
      searchLocations('Brookfield'),
      (error) => error.code === 'LOCATION_PROVIDER_NOT_CONFIGURED'
    )
  } finally {
    if (previousPlacesKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY
    else process.env.GOOGLE_PLACES_API_KEY = previousPlacesKey

    if (previousGeocodingKey === undefined) delete process.env.GOOGLE_GEOCODING_API_KEY
    else process.env.GOOGLE_GEOCODING_API_KEY = previousGeocodingKey
  }
})

test('zero provider results return an empty suggestion list', async () => {
  const results = await searchLocations('NoSuchVenue', {
    fetcher: async () => ({ status: 'ZERO_RESULTS', results: [] }),
  })

  assert.deepEqual(results, [])
})
