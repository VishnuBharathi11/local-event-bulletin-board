import { useCallback, useMemo, useState } from 'react'
import {
  createDiscoveryState,
  DEFAULT_DISCOVERY_STATE,
} from '../state/discoveryState.js'
import {
  filterAndSortEvents,
  getActiveEvents,
  getCityOptions,
  getNeighborhoodOptions,
} from '../utils/eventDiscovery.js'

export function useEventDiscovery(rawEvents = []) {
  const [discovery, setDiscovery] = useState(() => createDiscoveryState())
  const now = new Date()

  const activeEvents = useMemo(() => getActiveEvents(rawEvents, now), [rawEvents])
  const cityOptions = useMemo(() => getCityOptions(activeEvents), [activeEvents])
  const neighborhoodOptions = useMemo(
    () => getNeighborhoodOptions(activeEvents, discovery.selectedCity),
    [activeEvents, discovery.selectedCity],
  )
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
    setDiscovery((current) => ({ ...current, selectedCity, selectedNeighborhood: 'All' }))
  }, [])

  const updateNeighborhood = useCallback((selectedNeighborhood) => {
    setDiscovery((current) => ({ ...current, selectedNeighborhood }))
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
    neighborhoodOptions,
    updateSearchQuery,
    updateCategory,
    updateCity,
    updateNeighborhood,
    updateDateFilter,
    updateSortOrder,
    clearFilters,
  }
}
