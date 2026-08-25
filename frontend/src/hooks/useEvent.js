import { useEffect, useState } from 'react'
import { getEventById } from '../services/eventService.js'

export function useEvent(eventId) {
  const [state, setState] = useState({ status: 'loading', event: null, error: null })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ status: 'loading', event: null, error: null })
      try {
        const event = await getEventById(eventId)
        if (!cancelled) {
          setState({ status: event ? 'success' : 'not-found', event, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: error.message === 'Event not found' ? 'not-found' : 'error',
            event: null,
            error: error.message,
          })
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [eventId])

  return state
}
