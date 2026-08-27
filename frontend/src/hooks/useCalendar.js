import { useEffect, useMemo, useState } from 'react'
import { getEvents } from '../services/eventService.js'
import { useLocation } from '../context/LocationContext.jsx'
import {
  addMonths,
  getCalendarEvents,
  getEventDaysForMonth,
  getEventsForDate,
  startOfMonth,
  startOfToday,
} from '../utils/calendar.js'

export function useCalendar() {
  const { district } = useLocation()
  const [state, setState] = useState({ status: 'loading', events: [], error: null })
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth())
  const [selectedDate, setSelectedDate] = useState(() => startOfToday())

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

  const activeEvents = useMemo(
    () => {
      if (district) {
        return state.events.filter(event => !event.district || event.district === district)
      }
      return state.events
    },
    [state.events, district],
  )

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
    onPreviousMonth: previousMonth,
    onNextMonth: nextMonth,
    onToday: goToToday,
    onDateSelected: selectDate,
  }
}
