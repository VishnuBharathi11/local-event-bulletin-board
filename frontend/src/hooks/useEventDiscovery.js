import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation } from '../context/LocationContext.jsx'
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
  const { district, status: locationStatus, detectLocation } = useLocation()
  const [discovery, setDiscovery] = useState(() => createDiscoveryState())
  const now = new Date()


  const activeEvents = useMemo(() => {
    const active = getActiveEvents(rawEvents, now)
    if (!district) return active

    const normalizedDetected = district.toLowerCase().trim()
    const filtered = active.filter(event => {
      if (event.district) {
        const normalizedEventDistrict = event.district.toLowerCase().trim()
        return normalizedEventDistrict === normalizedDetected ||
               normalizedEventDistrict.includes(normalizedDetected) ||
               normalizedDetected.includes(normalizedEventDistrict)
      }
      const searchSpace = `${event.city || ''} ${event.neighborhood || ''}`.toLowerCase()
      return searchSpace.includes(normalizedDetected)
    })

    console.log("--- DISTRICT FILTER VERIFICATION ---")
    console.log("DETECTED USER DISTRICT:", district)
    console.log("TOTAL EVENTS RECEIVED:", active.length)
    console.log("EVENTS AFTER DISTRICT FILTER:", filtered.length)
    console.log("EVENTS EXCLUDED BY DISTRICT:", active.length - filtered.length)

    return filtered
  }, [rawEvents, now, district])

  const cityOptions = useMemo(() => {
    const options = getCityOptions(activeEvents, district)
    console.log("CITY OPTIONS GENERATED:", options)
    return options
  }, [activeEvents, district])

  const events = useMemo(
    () => filterAndSortEvents(activeEvents, discovery, now, district),
    [activeEvents, discovery, now, district],
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
    districtEvents: activeEvents,
    cityOptions,
    updateSearchQuery,
    updateCategory,
    updateCity,
    updateDateFilter,
    updateSortOrder,
    clearFilters,
  }
}
