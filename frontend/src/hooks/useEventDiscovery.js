import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation } from '../context/LocationContext.jsx'
import {
  createDiscoveryState,
  DEFAULT_DISCOVERY_STATE,
  EVENT_CATEGORIES,
} from '../state/discoveryState.js'
import {
  filterAndSortEvents,
  getActiveEvents,
  getCityOptions,
} from '../utils/eventDiscovery.js'

export function useEventDiscovery(rawEvents = []) {
  const { currentUser } = useAuth()
  const { district, localities, status: locationStatus, detectLocation } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialDateParam = searchParams.get('date')

  const [discovery, setDiscovery] = useState(() =>
    createDiscoveryState(initialDateParam ? { selectedDateFilter: initialDateParam } : {})
  )
  const now = new Date()

  // Sync state if URL query param changes
  useEffect(() => {
    const dateParam = searchParams.get('date')
    if (dateParam) {
      setDiscovery((curr) => (curr.selectedDateFilter !== dateParam ? { ...curr, selectedDateFilter: dateParam } : curr))
    }
  }, [searchParams])

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

    return filtered
  }, [rawEvents, now, district])

  const cityOptions = useMemo(() => {
    return getCityOptions(activeEvents, district, localities)
  }, [activeEvents, district, localities])

  const events = useMemo(
    () => filterAndSortEvents(activeEvents, discovery, now, district, localities),
    [activeEvents, discovery, now, district, localities],
  )

  const categoryCounts = useMemo(() => {
    const baseDiscovery = { ...discovery, selectedCategory: 'All' }
    const baseFiltered = filterAndSortEvents(activeEvents, baseDiscovery, now, district, localities)
    const counts = { All: baseFiltered.length }
    EVENT_CATEGORIES.forEach(cat => {
      if (cat !== 'All') {
        counts[cat] = baseFiltered.filter(e => e.category === cat).length
      }
    })
    return counts
  }, [activeEvents, discovery.searchQuery, discovery.selectedCity, discovery.selectedDateFilter, now, district, localities])

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
    setSearchParams((prevParams) => {
      const next = new URLSearchParams(prevParams)
      if (selectedDateFilter && selectedDateFilter !== 'All Upcoming') {
        next.set('date', selectedDateFilter)
      } else {
        next.delete('date')
      }
      return next
    }, { replace: true })
  }, [setSearchParams])

  const updateSortOrder = useCallback((selectedSortOrder) => {
    setDiscovery((current) => ({ ...current, selectedSortOrder }))
  }, [])

  const clearFilters = useCallback(() => {
    setDiscovery({ ...DEFAULT_DISCOVERY_STATE })
    setSearchParams((prevParams) => {
      const next = new URLSearchParams(prevParams)
      next.delete('date')
      return next
    }, { replace: true })
  }, [setSearchParams])

  return {
    discovery,
    events,
    activeEvents,
    districtEvents: activeEvents,
    cityOptions,
    categoryCounts,
    updateSearchQuery,
    updateCategory,
    updateCity,
    updateDateFilter,
    updateSortOrder,
    clearFilters,
  }
}
