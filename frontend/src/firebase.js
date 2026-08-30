import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = Object.freeze({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

let firebaseApp
let firebaseAuth

export function getFirebaseAuth() {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
    const error = new Error('Google authentication is not configured for this environment.')
    error.code = 'auth/configuration-error'
    throw error
  }

  if (!firebaseApp) firebaseApp = initializeApp(firebaseConfig)
  if (!firebaseAuth) firebaseAuth = getAuth(firebaseApp)
  return firebaseAuth
}

export { firebaseConfig }
