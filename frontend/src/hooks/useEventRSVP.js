import { useCallback, useEffect, useState } from 'react'
import { getRSVPStatus, removeRSVP, rsvpToEvent } from '../services/rsvpService.js'

export function useEventRSVP(eventId, enabled = true) {
  const [state, setState] = useState({ status: enabled ? 'loading' : 'unauthenticated', going: false, action: 'idle', error: null })

  const loadStatus = useCallback(async () => {
    if (!eventId || !enabled) {
      setState({ status: 'unauthenticated', going: false, action: 'idle', error: null })
      return
    }
    setState((current) => ({ ...current, status: 'loading', error: null }))
    try {
      const result = await getRSVPStatus(eventId)
      setState({ status: 'ready', going: Boolean(result.going), action: 'idle', error: null })
    } catch (error) {
      setState({ status: 'error', going: false, action: 'idle', error: error.message })
    }
  }, [eventId, enabled])

  useEffect(() => { loadStatus() }, [loadStatus])

  const setGoing = useCallback(async () => {
    if (!enabled) return false
    setState((current) => ({ ...current, action: 'adding', error: null }))
    try {
      await rsvpToEvent(eventId)
      setState({ status: 'ready', going: true, action: 'idle', error: null })
      return true
    } catch (error) {
      setState((current) => ({ ...current, action: 'idle', error: error.message }))
      return false
    }
  }, [eventId, enabled])

  const setNotGoing = useCallback(async () => {
    if (!enabled) return false
    setState((current) => ({ ...current, action: 'removing', error: null }))
    try {
      await removeRSVP(eventId)
      setState({ status: 'ready', going: false, action: 'idle', error: null })
      return true
    } catch (error) {
      setState((current) => ({ ...current, action: 'idle', error: error.message }))
      return false
    }
  }, [eventId, enabled])

  return { ...state, reload: loadStatus, setGoing, setNotGoing, isBusy: state.action !== 'idle' }
}
