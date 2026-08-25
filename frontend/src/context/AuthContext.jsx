import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading')
  const [currentUser, setCurrentUser] = useState(null)

  async function refreshCurrentUser() {
    try {
      const response = await authService.getCurrentUser()
      setCurrentUser(response.user)
      setStatus('authenticated')
      return response.user
    } catch (error) {
      setCurrentUser(null)
      setStatus(error.status === 401 ? 'unauthenticated' : 'unauthenticated')
      return null
    }
  }

  useEffect(() => {
    refreshCurrentUser()
  }, [])

  async function login(input) {
    const response = await authService.login(input)
    setCurrentUser(response.user)
    setStatus('authenticated')
    return response.user
  }

  async function register(input) {
    const response = await authService.register(input)
    setCurrentUser(response.user)
    setStatus('authenticated')
    return response.user
  }

  async function logout() {
    await authService.logout()
    setCurrentUser(null)
    setStatus('unauthenticated')
  }

  const value = useMemo(() => ({
    status,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    unauthenticated: status === 'unauthenticated',
    currentUser,
    login,
    register,
    logout,
    refreshCurrentUser,
  }), [status, currentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
