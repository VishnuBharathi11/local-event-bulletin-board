const https = require('https')

const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 100
const MAX_RESULTS = 5

function normalizeQuery(query) {
  if (typeof query !== 'string') {
    const error = new Error('Location search query is required.')
    error.code = 'LOCATION_QUERY_INVALID'
    throw error
  }

  const normalized = query.trim()
  if (normalized.length < MIN_QUERY_LENGTH) {
    const error = new Error(`Location search query must contain at least ${MIN_QUERY_LENGTH} characters.`)
    error.code = 'LOCATION_QUERY_TOO_SHORT'
    throw error
  }

  if (normalized.length > MAX_QUERY_LENGTH) {
    const error = new Error(`Location search query must not exceed ${MAX_QUERY_LENGTH} characters.`)
    error.code = 'LOCATION_QUERY_TOO_LONG'
    throw error
  }

  return normalized
}

function getProviderApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY || ''
}

function requestGooglePlaces(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        data += chunk
      })
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 400) {
          const error = new Error(`Location provider returned HTTP ${response.statusCode}.`)
          error.code = 'LOCATION_PROVIDER_HTTP_ERROR'
          return reject(error)
        }

        try {
          resolve(JSON.parse(data))
        } catch {
          const error = new Error('Location provider returned malformed JSON.')
          error.code = 'LOCATION_PROVIDER_MALFORMED_RESPONSE'
          reject(error)
        }
      })
    })

    request.setTimeout(8000, () => {
      request.destroy()
      const error = new Error('Location provider request timed out.')
      error.code = 'LOCATION_PROVIDER_TIMEOUT'
      reject(error)
    })

    request.on('error', (error) => {
      const wrapped = new Error('Unable to reach the location provider.')
      wrapped.code = 'LOCATION_PROVIDER_NETWORK_ERROR'
      wrapped.cause = error
      reject(wrapped)
    })
  })
}

function getAddressComponent(result, acceptedTypes) {
  const components = Array.isArray(result?.address_components) ? result.address_components : []
  const component = components.find((item) => {
    const types = Array.isArray(item?.types) ? item.types : []
    return acceptedTypes.some((type) => types.includes(type))
  })

  return component?.long_name || ''
}

function normalizePlaceResult(result) {
  if (!result || typeof result !== 'object') return null

  const venue = typeof result.name === 'string' ? result.name.trim() : ''
  const address = typeof result.formatted_address === 'string' ? result.formatted_address.trim() : ''
  const location = result.geometry?.location
  const latitude = Number(location?.lat)
  const longitude = Number(location?.lng)

  if (!venue && !address) return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const city = getAddressComponent(result, [
    'locality',
    'postal_town',
    'administrative_area_level_2',
  ])

  const neighborhood = getAddressComponent(result, [
    'neighborhood',
    'sublocality',
    'sublocality_level_1',
  ])

  return {
    venue: venue || address,
    address,
    city,
    neighborhood,
    latitude,
    longitude,
  }
}

function deduplicateSuggestions(results) {
  const seen = new Set()
  const suggestions = []

  for (const suggestion of results) {
    const key = [suggestion.venue, suggestion.address, suggestion.city]
      .map((value) => String(value || '').trim().toLowerCase())
      .join('|')

    if (!key || seen.has(key)) continue
    seen.add(key)
    suggestions.push(suggestion)

    if (suggestions.length >= MAX_RESULTS) break
  }

  return suggestions
}

async function searchLocations(query, options = {}) {
  const normalizedQuery = normalizeQuery(query)
  const apiKey = getProviderApiKey()

  if (!apiKey) {
    const error = new Error('Location provider is not configured. Set GOOGLE_PLACES_API_KEY or GOOGLE_GEOCODING_API_KEY on the backend.')
    error.code = 'LOCATION_PROVIDER_NOT_CONFIGURED'
    throw error
  }

  const fetcher = typeof options.fetcher === 'function' ? options.fetcher : requestGooglePlaces
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(normalizedQuery)}&region=in&key=${encodeURIComponent(apiKey)}`
  const payload = await fetcher(url)

  if (!payload || typeof payload !== 'object') {
    const error = new Error('Location provider returned an invalid response.')
    error.code = 'LOCATION_PROVIDER_MALFORMED_RESPONSE'
    throw error
  }

  if (payload.status === 'ZERO_RESULTS') return []

  if (payload.status && payload.status !== 'OK') {
    const error = new Error('Location provider could not complete the search.')
    error.code = 'LOCATION_PROVIDER_ERROR'
    error.providerStatus = payload.status
    throw error
  }

  if (!Array.isArray(payload.results)) {
    const error = new Error('Location provider returned no usable results array.')
    error.code = 'LOCATION_PROVIDER_MALFORMED_RESPONSE'
    throw error
  }

  return deduplicateSuggestions(
    payload.results
      .map(normalizePlaceResult)
      .filter(Boolean)
  )
}

module.exports = {
  MIN_QUERY_LENGTH,
  MAX_QUERY_LENGTH,
  MAX_RESULTS,
  normalizeQuery,
  normalizePlaceResult,
  deduplicateSuggestions,
  searchLocations,
}
