import { useCallback, useEffect, useState } from 'react'
import { getEvents } from '../services/eventService.js'

export function useEvents() {
  const [state, setState] = useState({ status: 'loading', events: [], error: null })

  const loadEvents = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    try {
      const events = await getEvents()
      console.log("USE_EVENTS HOOK: Received", events.length, "total events from API");
      setState({ status: 'success', events, error: null })
    } catch (error) {
      setState({ status: 'error', events: [], error: error.message })
    }
  }, [])

  const removeEvent = useCallback((eventId) => {
    setState((current) => ({
      ...current,
      events: current.events.filter((event) => event.eventId !== eventId),
    }))
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return { ...state, reload: loadEvents, removeEvent }
}
