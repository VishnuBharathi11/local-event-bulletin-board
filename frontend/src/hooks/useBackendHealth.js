import { useEffect, useState } from 'react'
import { getBackendHealth } from '../services/healthService.js'

export function useBackendHealth() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true

    getBackendHealth()
      .then(() => {
        if (active) setStatus('online')
      })
      .catch(() => {
        if (active) setStatus('offline')
      })

    return () => {
      active = false
    }
  }, [])

  return { status }
}
