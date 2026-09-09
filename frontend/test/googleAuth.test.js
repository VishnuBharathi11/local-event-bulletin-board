import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const firebaseConfig = read('src/firebase.js')
const authService = read('src/services/authService.js')
const authContext = read('src/context/AuthContext.jsx')
const loginPage = read('src/pages/LoginPage.jsx')
const registerPage = read('src/pages/RegisterPage.jsx')
const envExample = read('.env.example')

test('Firebase client configuration is initialized exclusively from Vite environment variables', () => {
  assert.match(firebaseConfig, /import\.meta\.env\.VITE_FIREBASE_API_KEY/)
  assert.match(firebaseConfig, /import\.meta\.env\.VITE_FIREBASE_AUTH_DOMAIN/)
  assert.match(firebaseConfig, /import\.meta\.env\.VITE_FIREBASE_PROJECT_ID/)
  assert.match(firebaseConfig, /import\.meta\.env\.VITE_FIREBASE_STORAGE_BUCKET/)
  assert.match(firebaseConfig, /import\.meta\.env\.VITE_FIREBASE_MESSAGING_SENDER_ID/)
  assert.match(firebaseConfig, /import\.meta\.env\.VITE_FIREBASE_APP_ID/)
  assert.match(firebaseConfig, /initializeApp\(firebaseConfig\)/)
  assert.match(firebaseConfig, /getAuth\(firebaseApp\)/)
})

test('.env.example documents the required VITE_FIREBASE_* variables without hardcoded secrets', () => {
  assert.match(envExample, /VITE_FIREBASE_API_KEY=/)
  assert.match(envExample, /VITE_FIREBASE_AUTH_DOMAIN=/)
  assert.match(envExample, /VITE_FIREBASE_PROJECT_ID=/)
  assert.match(envExample, /VITE_FIREBASE_STORAGE_BUCKET=/)
  assert.match(envExample, /VITE_FIREBASE_MESSAGING_SENDER_ID=/)
  assert.match(envExample, /VITE_FIREBASE_APP_ID=/)
})

test('authService exposes loginWithGoogle and calls /auth/google via apiRequest', () => {
  assert.match(authService, /export function loginWithGoogle\(idToken\)/)
  assert.match(authService, /apiRequest\('\/auth\/google',\s*\{\s*method:\s*'POST',\s*body:\s*JSON\.stringify\(\{\s*idToken\s*\}\)/)
})

test('authService handles signInWithPopup, popup cancellation, popup blocked, and backend errors', () => {
  assert.match(authService, /signInWithPopup\(auth,\s*provider\)/)
  assert.match(authService, /auth\/popup-closed-by-user/)
  assert.match(authService, /auth\/cancelled-popup-request/)
  assert.match(authService, /auth\/popup-blocked/)
  assert.match(authService, /signOut\(auth\)/)
})

test('AuthContext exposes loginWithGoogle and updates single authenticated state', () => {
  assert.match(authContext, /const loginWithGoogle = useCallback/)
  assert.match(authContext, /authService\.signInWithGoogle\(\)/)
  assert.match(authContext, /setCurrentUser\(response\.user\)/)
  assert.match(authContext, /setStatus\('authenticated'\)/)
  assert.match(authContext, /loginWithGoogle,/)
  assert.match(authContext, /signOutFromGoogle/)
})

test('LoginPage renders OR divider and Continue with Google button with loading/error handling', () => {
  assert.match(loginPage, /const \{[^}]*loginWithGoogle[^}]*\} = useAuth\(\)/)
  assert.match(loginPage, /<span>OR<\/span>/)
  assert.match(loginPage, /Continue with Google/)
  assert.match(loginPage, /disabled=\{submitting\}/)
  assert.match(loginPage, /handleGoogleSignIn/)
  assert.match(loginPage, /submitting \? 'Signing in…' : 'Continue with Google'/)
  assert.match(loginPage, /navigate\(location\.state\?\.from \|\| '\/', \{ replace: true \}\)/)
})

test('RegisterPage renders OR divider and Continue with Google button without password requirement', () => {
  assert.match(registerPage, /const \{[^}]*loginWithGoogle[^}]*\} = useAuth\(\)/)
  assert.match(registerPage, /<span>OR<\/span>/)
  assert.match(registerPage, /Continue with Google/)
  assert.match(registerPage, /disabled=\{submitting\}/)
  assert.match(registerPage, /handleGoogleSignIn/)
  assert.match(registerPage, /submitting \? 'Signing in…' : 'Continue with Google'/)
  assert.match(registerPage, /navigate\('\/', \{ replace: true \}\)/)
})
