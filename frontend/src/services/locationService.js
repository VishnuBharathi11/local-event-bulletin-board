import { apiRequest } from './apiClient.js'

export function getDistrictFromCoords(lat, lng) {
  return apiRequest(`/location/district?lat=${lat}&lng=${lng}`)
}

export function getLocalities(district) {
  return apiRequest(`/location/areas?district=${encodeURIComponent(district)}`)
}
