import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService.js'
import { getFirebaseAuth } from '../firebase.js'
import { removeAuthToken, setAuthToken } from '../services/apiClient.js'

const AuthContext = createContext(null)

function getStoredUser() {
  try {
    const raw = localStorage.getItem('eventhive_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function getFirebaseUser() {
  try {
    const auth = getFirebaseAuth()
    if (!auth) return null
    if (auth.currentUser) return auth.currentUser
    if (typeof auth.authStateReady === 'function') {
      await auth.authStateReady()
      return auth.currentUser
    }
    return await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (typeof unsubscribe === 'function') unsubscribe()
        resolve(user)
      }, () => resolve(null))
      setTimeout(() => resolve(null), 1500)
    })
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser())
  const [status, setStatus] = useState(() => (getStoredUser() ? 'authenticated' : 'loading'))

  const refreshCurrentUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser()
      if (response?.user) {
        setCurrentUser(response.user)
        setStatus('authenticated')
        try {
          localStorage.setItem('eventhive_user', JSON.stringify(response.user))
        } catch {}
        return response.user
      }
    } catch {
      // Backend /auth/me failed; check if Firebase has an active Google session to recover
      try {
        const firebaseUser = await getFirebaseUser()
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken()
          if (idToken) {
            const authResult = await authService.authenticateWithGoogle(idToken, 'login')
            if (authResult?.token) {
              setAuthToken(authResult.token)
            }
            if (authResult?.user) {
              setCurrentUser(authResult.user)
              setStatus('authenticated')
              try {
                localStorage.setItem('eventhive_user', JSON.stringify(authResult.user))
              } catch {}
              return authResult.user
            }
          }
        }
      } catch {
        // Fallback recovery failed
      }

      removeAuthToken()
      try {
        localStorage.removeItem('eventhive_user')
      } catch {}
      setCurrentUser(null)
      setStatus('unauthenticated')
      return null
    }
  }, [])

  useEffect(() => {
    refreshCurrentUser()
  }, [refreshCurrentUser])

  const login = useCallback(async (input) => {
    const response = await authService.login(input)
    if (response?.token) {
      setAuthToken(response.token)
    }
    if (response?.user) {
      try {
        localStorage.setItem('eventhive_user', JSON.stringify(response.user))
      } catch {}
    }
    setCurrentUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const register = useCallback(async (input) => {
    const response = await authService.register(input)
    if (response?.token) {
      setAuthToken(response.token)
    }
    if (response?.user) {
      try {
        localStorage.setItem('eventhive_user', JSON.stringify(response.user))
      } catch {}
    }
    setCurrentUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const loginWithGoogle = useCallback(async (mode) => {
    const response = mode ? await authService.signInWithGoogle(mode) : await authService.signInWithGoogle()
    if (response?.token) {
      setAuthToken(response.token)
    }
    if (response?.user) {
      try {
        localStorage.setItem('eventhive_user', JSON.stringify(response.user))
      } catch {}
    }
    setCurrentUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Server logout error:', error)
    } finally {
      await authService.signOutFromGoogle()
      removeAuthToken()
      try {
        localStorage.removeItem('eventhive_user')
        localStorage.removeItem('detected_district')
        localStorage.removeItem('detected_locality')
      } catch {}
      setCurrentUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    const response = await authService.updateProfile(updates)
    if (response?.user) {
      try {
        localStorage.setItem('eventhive_user', JSON.stringify(response.user))
      } catch {}
    }
    setCurrentUser(response.user)
    return response.user
  }, [])

  const value = useMemo(() => ({
    status,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    unauthenticated: status === 'unauthenticated',
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshCurrentUser,
  }), [status, currentUser, login, register, loginWithGoogle, logout, updateProfile, refreshCurrentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
