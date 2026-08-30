import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { expressInterest, getEventRequests, getInterestStatus, removeInterest } from '../services/eventRequestService.js'

export function useEventRequests() {
  const { authenticated, currentUser } = useAuth()
  const [state, setState] = useState({ status: 'loading', requests: [], error: null })
  const [interestedIds, setInterestedIds] = useState(() => new Set())
  const [interestLoadingId, setInterestLoadingId] = useState(null)
  const [interestError, setInterestError] = useState(null)

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    setInterestError(null)
    setInterestedIds(new Set())
    try {
      let requests = await getEventRequests()
      let existingInterestIds = new Set()
      if (authenticated && requests.length > 0) {
        if (currentUser?.userId) requests = requests.filter(r => r.organizerId !== currentUser.userId)
        const interestResults = await Promise.all(requests.map(async (request) => ({ requestId: request.requestId, interested: await getInterestStatus(request.requestId) })))
        existingInterestIds = new Set(interestResults.filter((result) => Boolean(result.interested?.interested)).map((result) => result.requestId))
      }
      setInterestedIds(existingInterestIds)
      setState({ status: 'success', requests, error: null })
    } catch (error) {
      setState({ status: 'error', requests: [], error: error.message })
      setInterestedIds(new Set())
    }
  }, [authenticated, currentUser?.userId])

  useEffect(() => { reload() }, [reload])

  const toggleInterest = useCallback(async (requestId) => {
    if (!authenticated || interestLoadingId || interestedIds.has(requestId)) return
    const currentlyInterested = interestedIds.has(requestId)
    setInterestLoadingId(requestId)
    setInterestError(null)
    try {
      const updatedRequest = currentlyInterested ? await removeInterest(requestId) : await expressInterest(requestId)
      setInterestedIds((current) => {
        const next = new Set(current)
        if (currentlyInterested) next.delete(requestId)
        else next.add(requestId)
        return next
      })
      setState((current) => ({ ...current, requests: current.requests.map((request) => request.requestId === requestId ? updatedRequest : request) }))
    } catch (error) {
      setInterestError({ requestId, message: error.message })
    } finally {
      setInterestLoadingId(null)
    }
  }, [authenticated, interestLoadingId, interestedIds])

  return { ...state, reload, interestedIds, interestLoadingId, interestError, toggleInterest }
}
