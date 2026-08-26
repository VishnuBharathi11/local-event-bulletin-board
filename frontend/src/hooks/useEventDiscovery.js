import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  createDiscoveryState,
  DEFAULT_DISCOVERY_STATE,
} from '../state/discoveryState.js'
import {
  filterAndSortEvents,
  getActiveEvents,
  getCityOptions,
} from '../utils/eventDiscovery.js'

export function useEventDiscovery(rawEvents = []) {
  const { currentUser } = useAuth()
  const [discovery, setDiscovery] = useState(() => createDiscoveryState())
  const now = new Date()

  // Initialize city from user profile once
  const [userCitySet, setUserCitySet] = useState(false)
  useEffect(() => {
    if (currentUser?.city && !userCitySet && discovery.selectedCity === 'All') {
      setDiscovery(current => ({ ...current, selectedCity: currentUser.city }))
      setUserCitySet(true)
    }
  }, [currentUser, userCitySet, discovery.selectedCity])

  const activeEvents = useMemo(() => getActiveEvents(rawEvents, now), [rawEvents])
  const cityOptions = useMemo(() => getCityOptions(activeEvents), [activeEvents])
  const events = useMemo(
    () => filterAndSortEvents(rawEvents, discovery, now),
    [rawEvents, discovery],
  )

  const updateSearchQuery = useCallback((searchQuery) => {
    setDiscovery((current) => ({ ...current, searchQuery }))
  }, [])

  const updateCategory = useCallback((selectedCategory) => {
    setDiscovery((current) => ({ ...current, selectedCategory }))
  }, [])

  const updateCity = useCallback((selectedCity) => {
    setDiscovery((current) => ({ ...current, selectedCity }))
  }, [])

  const updateDateFilter = useCallback((selectedDateFilter) => {
    setDiscovery((current) => ({ ...current, selectedDateFilter }))
  }, [])

  const updateSortOrder = useCallback((selectedSortOrder) => {
    setDiscovery((current) => ({ ...current, selectedSortOrder }))
  }, [])

  const clearFilters = useCallback(() => {
    setDiscovery({ ...DEFAULT_DISCOVERY_STATE })
  }, [])

  return {
    discovery,
    events,
    activeEvents,
    cityOptions,
    updateSearchQuery,
    updateCategory,
    updateCity,
    updateDateFilter,
    updateSortOrder,
    clearFilters,
  }
}
