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

function requestGooglePlaces(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (response) => {
        let raw = ''

        response.setEncoding('utf8')

        response.on('data', (chunk) => {
          raw += chunk
        })

        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            const error = new Error(
              `Location provider returned HTTP ${response.statusCode}.`
            )
            error.code = 'LOCATION_PROVIDER_HTTP_ERROR'
            reject(error)
            return
          }

          try {
            resolve(JSON.parse(raw))
          } catch {
            const error = new Error(
              'Location provider returned malformed JSON.'
            )
            error.code = 'LOCATION_PROVIDER_MALFORMED_RESPONSE'
            reject(error)
          }
        })
      }
    )

    request.setTimeout(8000, () => {
      request.destroy()

      const error = new Error(
        'Location provider request timed out.'
      )
      error.code = 'LOCATION_PROVIDER_TIMEOUT'
      reject(error)
    })

    request.on('error', (error) => {
      const wrapped = new Error(
        'Unable to reach the location provider.'
      )
      wrapped.code = 'LOCATION_PROVIDER_NETWORK_ERROR'
      wrapped.cause = error
      reject(wrapped)
    })

    if (options.body) {
      request.write(options.body)
    }

    request.end()
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
  if (!result || typeof result !== 'object') {
    return null
  }

  const venue =
    String(
      result.displayName?.text ||
      result.name ||
      ''
    ).trim()

  const address =
    String(
      result.formattedAddress ||
      result.formatted_address ||
      ''
    ).trim()

  const latitude = Number(
    result.location?.latitude ??
    result.geometry?.location?.lat
  )

  const longitude = Number(
    result.location?.longitude ??
    result.geometry?.location?.lng
  )

  if (
    !venue ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null
  }

  const components =
    Array.isArray(result.addressComponents)
      ? result.addressComponents
      : Array.isArray(result.address_components)
        ? result.address_components
        : []

  const findComponent = (types) => {
    const component = components.find((item) =>
      Array.isArray(item.types) &&
      types.some((type) => item.types.includes(type))
    )

    return String(
      component?.longText ||
      component?.long_name ||
      ''
    ).trim()
  }

  const city = findComponent([
    'locality',
    'postal_town',
  ])

  const neighborhood = findComponent([
    'sublocality',
    'sublocality_level_1',
    'neighborhood',
  ])

  return {
    venue,
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

  let apiKey = ''

  const hasInjectedFetcher = typeof options.fetcher === 'function'

  if (!hasInjectedFetcher) {
    apiKey = getProviderApiKey()

    if (!apiKey) {
      const error = new Error(
        'Location provider is not configured. Set GOOGLE_PLACES_API_KEY or GOOGLE_GEOCODING_API_KEY on the backend.'
      )
      error.code = 'LOCATION_PROVIDER_NOT_CONFIGURED'
      throw error
    }
  }

  let payload

  if (hasInjectedFetcher) {
    const url =
      `https://places.googleapis.com/v1/places:searchText`

    payload = await options.fetcher(url)
  } else {
    const url =
      'https://places.googleapis.com/v1/places:searchText'

    const requestBody = JSON.stringify({
      textQuery: normalizedQuery,
      pageSize: MAX_RESULTS,
    })

    payload = await requestGooglePlaces(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.addressComponents',
        ].join(','),
      },
      body: requestBody,
    })
  }

  if (!payload || typeof payload !== 'object') {
    const error = new Error(
      'Location provider returned an invalid response.'
    )
    error.code = 'LOCATION_PROVIDER_MALFORMED_RESPONSE'
    throw error
  }

  if (payload.error) {
    const error = new Error(
      'Location provider could not complete the search.'
    )
    error.code = 'LOCATION_PROVIDER_ERROR'
    error.providerStatus = payload.error.status
    throw error
  }

  const places = Array.isArray(payload.places)
    ? payload.places
    : []

  return deduplicateSuggestions(
    places
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
