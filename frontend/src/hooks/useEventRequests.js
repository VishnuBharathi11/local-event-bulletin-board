import { useCallback, useEffect, useState } from 'react'
import { expressInterest, getEventRequests } from '../services/eventRequestService.js'

export function useEventRequests() {
  const [state, setState] = useState({ status: 'loading', requests: [], error: null })
  const [interestedIds, setInterestedIds] = useState(() => new Set())
  const [interestLoadingId, setInterestLoadingId] = useState(null)

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    try {
      const requests = await getEventRequests()
      setState({ status: 'success', requests, error: null })
    } catch (error) {
      setState({ status: 'error', requests: [], error: error.message })
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const addInterest = useCallback(async (requestId) => {
    if (interestLoadingId || interestedIds.has(requestId)) return
    setInterestLoadingId(requestId)
    try {
      const updatedRequest = await expressInterest(requestId)
      setInterestedIds((current) => new Set(current).add(requestId))
      setState((current) => ({
        ...current,
        requests: current.requests.map((request) => request.requestId === requestId ? updatedRequest : request),
      }))
    } finally {
      setInterestLoadingId(null)
    }
  }, [interestLoadingId, interestedIds])

  return { ...state, reload, interestedIds, interestLoadingId, addInterest }
}
