import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading')
  const [currentUser, setCurrentUser] = useState(null)

  const refreshCurrentUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser()
      setCurrentUser(response.user)
      setStatus('authenticated')
      return response.user
    } catch {
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
    setCurrentUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const register = useCallback(async (input) => {
    const response = await authService.register(input)
    setCurrentUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setCurrentUser(null)
    setStatus('unauthenticated')
  }, [])

  const updateProfile = useCallback(async (updates) => {
    const response = await authService.updateProfile(updates)
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
    logout,
    updateProfile,
    refreshCurrentUser,
  }), [status, currentUser, login, register, logout, updateProfile, refreshCurrentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
