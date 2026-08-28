import { useEffect, useMemo, useState } from 'react'
import { getEvents } from '../services/eventService.js'
import { useLocation } from '../context/LocationContext.jsx'
import { getCityOptions } from '../utils/eventDiscovery.js'
import {
  addMonths,
  getCalendarEvents,
  getEventDaysForMonth,
  getEventsForDate,
  startOfMonth,
  startOfToday,
} from '../utils/calendar.js'

export function useCalendar() {
  const { district, localities } = useLocation()
  const [state, setState] = useState({ status: 'loading', events: [], error: null })
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth())
  const [selectedDate, setSelectedDate] = useState(() => startOfToday())
  const [selectedCity, setSelectedCity] = useState('All')

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      setState((current) => ({ ...current, status: 'loading', error: null }))
      try {
        const events = await getEvents()
        if (!cancelled) setState({ status: 'success', events, error: null })
      } catch (error) {
        if (!cancelled) {
          setState({ status: 'error', events: [], error: error.message })
        }
      }
    }

    loadEvents()
    return () => { cancelled = true }
  }, [])

  const cityOptions = useMemo(() => {
    const calendarEvents = getCalendarEvents(state.events)
    return getCityOptions(calendarEvents, district, localities)
  }, [state.events, district, localities])

  const activeEvents = useMemo(() => {
    const calendarEvents = getCalendarEvents(state.events)
    if (!district) return calendarEvents

    const normalizedDetected = district.toLowerCase().trim()

    // Internal accurate matching logic for city/locality
    let allowedInternalValues = new Set();
    if (selectedCity !== 'All') {
      allowedInternalValues.add(selectedCity.toLowerCase().trim());

      const area = localities.find(a => a.name && a.name.toLowerCase().trim() === selectedCity.toLowerCase().trim());
      if (area && area.pincode) {
        allowedInternalValues.add(area.pincode.toLowerCase().trim());
      }

      calendarEvents.forEach(e => {
        const city = String(e.city || '').toLowerCase().trim();
        const neighborhood = String(e.neighborhood || '').toLowerCase().trim();
        if (city === selectedCity.toLowerCase().trim()) {
          if (neighborhood) allowedInternalValues.add(neighborhood);
        }
        if (neighborhood === selectedCity.toLowerCase().trim()) {
          if (city) allowedInternalValues.add(city);
        }
      });
    }

    return calendarEvents.filter(event => {
      // 1. District Filter
      if (event.district) {
        const normalizedEventDistrict = event.district.toLowerCase().trim()
        if (normalizedEventDistrict !== normalizedDetected && !normalizedEventDistrict.includes(normalizedDetected) && !normalizedDetected.includes(normalizedEventDistrict)) {
          return false
        }
      } else {
        const searchSpace = `${event.city || ''} ${event.neighborhood || ''}`.toLowerCase()
        if (!searchSpace.includes(normalizedDetected)) return false
      }

      // 2. City Filter
      if (selectedCity !== 'All') {
        const eventCity = String(event.city || '').toLowerCase().trim();
        const eventNeighborhood = String(event.neighborhood || '').toLowerCase().trim();
        if (!allowedInternalValues.has(eventCity) && !allowedInternalValues.has(eventNeighborhood)) {
          return false;
        }
      }

      return true
    })
  }, [state.events, district, selectedCity, localities])

  const eventDays = useMemo(
    () => getEventDaysForMonth(activeEvents, currentMonth),
    [activeEvents, currentMonth],
  )

  const eventsForDate = useMemo(
    () => getEventsForDate(activeEvents, selectedDate),
    [activeEvents, selectedDate],
  )

  function previousMonth() {
    setCurrentMonth((month) => addMonths(month, -1))
  }

  function nextMonth() {
    setCurrentMonth((month) => addMonths(month, 1))
  }

  function goToToday() {
    const today = startOfToday()
    setCurrentMonth(startOfMonth(today))
    setSelectedDate(today)
  }

  function selectDate(date) {
    const selected = new Date(date)
    selected.setHours(0, 0, 0, 0)
    setSelectedDate(selected)
  }

  return {
    status: state.status,
    error: state.error,
    currentMonth,
    selectedDate,
    eventDays,
    eventsForDate,
    cityOptions,
    selectedCity,
    onCityChange: setSelectedCity,
    onPreviousMonth: previousMonth,
    onNextMonth: nextMonth,
    onToday: goToToday,
    onDateSelected: selectDate,
  }
}
