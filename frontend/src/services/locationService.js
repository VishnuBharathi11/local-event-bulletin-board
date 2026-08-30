import { apiRequest } from './apiClient.js'

export function getDistrictFromCoords(lat, lng) {
  return apiRequest(`/location/district?lat=${lat}&lng=${lng}`)
}

export function getLocalities(district) {
  return apiRequest(`/location/localities?district=${encodeURIComponent(district)}`)
}

export function searchLocations(query) {
  const normalized = String(query || '').trim()
  return apiRequest(`/location/search?q=${encodeURIComponent(normalized)}`)
}
