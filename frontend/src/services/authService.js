import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

import { getFirebaseAuth } from '../firebase.js'

import { apiRequest } from './apiClient.js'

export function register(input) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function login(input) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  })
}

export function getCurrentUser() {
  return apiRequest('/auth/me')
}

export function updateProfile(updates) {
  return apiRequest('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export function authenticateWithGoogle(idToken, mode = 'login') {
  return apiRequest('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, mode }),
  })
}

export async function signInWithGoogle(mode = 'login') {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()

  provider.setCustomParameters({
    prompt: 'select_account',
  })

  let result

  try {
    result = await signInWithPopup(auth, provider)
  } catch (error) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      const cancelled = new Error(
        'Google sign-in was cancelled.'
      )
      cancelled.code = error.code
      throw cancelled
    }

    if (error?.code === 'auth/popup-blocked') {
      const blocked = new Error(
        'Google sign-in popup was blocked. Allow popups for EventHive and try again.'
      )
      blocked.code = error.code
      throw blocked
    }

    throw error
  }

  const idToken = await result.user.getIdToken()

  try {
    return await authenticateWithGoogle(idToken, mode)
  } catch (error) {
    await signOut(auth).catch(() => { })
    throw error
  }
}

export async function signOutFromGoogle() {
  try {
    const auth = getFirebaseAuth()
    await signOut(auth)
  } catch (error) {
    if (error?.code !== 'auth/configuration-error') {
      console.warn('Firebase logout error:', error)
    }
  }
}