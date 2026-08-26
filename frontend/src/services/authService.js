import { apiRequest } from './apiClient.js'

export function register(input) {
  return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(input) })
}

export function login(input) {
  return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(input) })
}

export function logout() {
  return apiRequest('/auth/logout', { method: 'POST' })
}

export function getCurrentUser() {
  return apiRequest('/auth/me')
}

export function updateProfile(updates) {
  return apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(updates) })
}
