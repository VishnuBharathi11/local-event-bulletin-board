import { useCallback, useEffect, useState } from 'react'
import { getEvents } from '../services/eventService.js'

export function useEvents() {
  const [state, setState] = useState({ status: 'loading', events: [], error: null })

  const loadEvents = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    try {
      const events = await getEvents()
      setState({ status: events.length === 0 ? 'empty' : 'success', events, error: null })
    } catch (error) {
      setState({ status: 'error', events: [], error: error.message })
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return { ...state, reload: loadEvents }
}
