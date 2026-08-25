import { useCallback, useEffect, useState } from 'react'
import { getRSVPStatus, removeRSVP, rsvpToEvent } from '../services/rsvpService.js'

export function useEventRSVP(eventId) {
  const [state, setState] = useState({ status: 'loading', going: false, action: 'idle', error: null })

  const loadStatus = useCallback(async () => {
    if (!eventId) return
    setState((current) => ({ ...current, status: 'loading', error: null }))
    try {
      const result = await getRSVPStatus(eventId)
      setState({ status: 'ready', going: Boolean(result.going), action: 'idle', error: null })
    } catch (error) {
      setState({ status: 'error', going: false, action: 'idle', error: error.message })
    }
  }, [eventId])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const setGoing = useCallback(async () => {
    setState((current) => ({ ...current, action: 'adding', error: null }))
    try {
      await rsvpToEvent(eventId)
      setState({ status: 'ready', going: true, action: 'idle', error: null })
      return true
    } catch (error) {
      setState((current) => ({ ...current, action: 'idle', error: error.message }))
      return false
    }
  }, [eventId])

  const setNotGoing = useCallback(async () => {
    setState((current) => ({ ...current, action: 'removing', error: null }))
    try {
      await removeRSVP(eventId)
      setState({ status: 'ready', going: false, action: 'idle', error: null })
      return true
    } catch (error) {
      setState((current) => ({ ...current, action: 'idle', error: error.message }))
      return false
    }
  }, [eventId])

  return {
    ...state,
    reload: loadStatus,
    setGoing,
    setNotGoing,
    isBusy: state.action !== 'idle',
  }
}
