import { useCallback, useEffect, useState } from 'react'
import { getRSVPStatus, removeRSVP, rsvpToEvent } from '../services/rsvpService.js'

// Global shared store for RSVP state and counts by eventId
const rsvpStore = new Map()
const listeners = new Map()

function subscribe(eventId, callback) {
  if (!listeners.has(eventId)) {
    listeners.set(eventId, new Set())
  }
  listeners.get(eventId).add(callback)
  return () => {
    const subs = listeners.get(eventId)
    if (subs) {
      subs.delete(callback)
      if (subs.size === 0) listeners.delete(eventId)
    }
  }
}

function notify(eventId) {
  const data = rsvpStore.get(eventId)
  const subs = listeners.get(eventId)
  if (subs && data) {
    subs.forEach((cb) => cb({ ...data }))
  }
}

export function updateEventRSVPStore(eventId, updates) {
  if (!eventId) return null
  const current = rsvpStore.get(eventId) || {
    status: 'loading',
    going: false,
    action: 'idle',
    error: null,
    rsvpCount: 0,
    hasCount: false,
  }
  const next = { ...current, ...updates }
  rsvpStore.set(eventId, next)
  notify(eventId)
  return next
}

export function getEventRSVPStore(eventId) {
  return eventId ? rsvpStore.get(eventId) : null
}

export function useEventRSVP(eventId, enabled = true, initialCount = null) {
  const [state, setState] = useState(() => {
    if (!eventId) {
      return {
        status: 'unauthenticated',
        going: false,
        action: 'idle',
        error: null,
        rsvpCount: 0,
        hasCount: false,
      }
    }

    const cached = rsvpStore.get(eventId)
    if (cached) {
      if (initialCount !== null && !cached.hasCount) {
        cached.rsvpCount = Number(initialCount) || 0
        cached.hasCount = true
      }
      return { ...cached }
    }

    const init = {
      status: enabled ? 'loading' : 'unauthenticated',
      going: false,
      action: 'idle',
      error: null,
      rsvpCount: initialCount !== null ? Number(initialCount) || 0 : 0,
      hasCount: initialCount !== null,
    }
    rsvpStore.set(eventId, init)
    return init
  })

  // Synchronize initialCount if provided and updated
  useEffect(() => {
    if (!eventId || initialCount === null) return
    const current = rsvpStore.get(eventId)
    const countNum = Number(initialCount) || 0
    if (!current) {
      updateEventRSVPStore(eventId, { rsvpCount: countNum, hasCount: true })
    } else if (!current.hasCount) {
      updateEventRSVPStore(eventId, { rsvpCount: countNum, hasCount: true })
    }
  }, [eventId, initialCount])

  // Subscribe to changes for this eventId
  useEffect(() => {
    if (!eventId) return undefined
    const unsubscribe = subscribe(eventId, (updatedState) => {
      setState(updatedState)
    })
    return unsubscribe
  }, [eventId])

  const loadStatus = useCallback(async () => {
    if (!eventId || !enabled) {
      updateEventRSVPStore(eventId, {
        status: 'unauthenticated',
        going: false,
        action: 'idle',
        error: null,
      })
      return
    }

    const current = rsvpStore.get(eventId)
    if (!current || current.status === 'unauthenticated' || current.status === 'loading') {
      updateEventRSVPStore(eventId, { status: 'loading', error: null })
    }

    try {
      const result = await getRSVPStatus(eventId)
      updateEventRSVPStore(eventId, {
        status: 'ready',
        going: Boolean(result.going),
        action: 'idle',
        error: null,
      })
    } catch (error) {
      updateEventRSVPStore(eventId, {
        status: 'error',
        going: false,
        action: 'idle',
        error: error.message,
      })
    }
  }, [eventId, enabled])

  useEffect(() => {
    if (!eventId || !enabled) return
    const current = rsvpStore.get(eventId)
    if (!current || current.status === 'loading' || current.status === 'unauthenticated') {
      loadStatus()
    }
  }, [eventId, enabled, loadStatus])

  const setGoing = useCallback(async () => {
    if (!enabled || !eventId) return false
    updateEventRSVPStore(eventId, { action: 'adding', error: null })
    try {
      await rsvpToEvent(eventId)
      const current = rsvpStore.get(eventId)
      const currentCount = current?.rsvpCount || 0
      updateEventRSVPStore(eventId, {
        status: 'ready',
        going: true,
        action: 'idle',
        error: null,
        rsvpCount: currentCount + 1,
        hasCount: true,
      })
      return true
    } catch (error) {
      updateEventRSVPStore(eventId, { action: 'idle', error: error.message })
      return false
    }
  }, [eventId, enabled])

  const setNotGoing = useCallback(async () => {
    if (!enabled || !eventId) return false
    updateEventRSVPStore(eventId, { action: 'removing', error: null })
    try {
      await removeRSVP(eventId)
      const current = rsvpStore.get(eventId)
      const currentCount = current?.rsvpCount || 0
      updateEventRSVPStore(eventId, {
        status: 'ready',
        going: false,
        action: 'idle',
        error: null,
        rsvpCount: Math.max(currentCount - 1, 0),
        hasCount: true,
      })
      return true
    } catch (error) {
      updateEventRSVPStore(eventId, { action: 'idle', error: error.message })
      return false
    }
  }, [eventId, enabled])

  return {
    ...state,
    reload: loadStatus,
    setGoing,
    setNotGoing,
    isBusy: state.action !== 'idle',
  }
}
