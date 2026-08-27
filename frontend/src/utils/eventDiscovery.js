import { DEFAULT_DISCOVERY_STATE } from '../state/discoveryState.js'

function isSameDay(first, second) {
  return first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
}

function isPastEvent(event, now) {
  const expireAt = Number(event.expireAt)
  return Number.isFinite(expireAt) && now.getTime() >= expireAt
}

function matchesDateFilter(startTime, filter, now) {
  const eventDate = new Date(Number(startTime))
  if (Number.isNaN(eventDate.getTime())) return false

  const today = new Date(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  switch (filter) {
    case 'All Upcoming':
      return true
    case 'Today':
      return isSameDay(eventDate, today)
    case 'Tomorrow':
      return isSameDay(eventDate, tomorrow)
    case 'This Week':
      return eventDate.getTime() < now.getTime() + (7 * 24 * 60 * 60 * 1000)
    case 'This Weekend': {
      const day = eventDate.getDay()
      return day === 0 || day === 6
    }
    default:
      return true
  }
}

export function getActiveEvents(events = [], now = new Date()) {
  return events.filter((event) => !isPastEvent(event, now))
}

export function getCityOptions(events = [], detectedDistrict = null) {
  let filteredEvents = events;

  if (detectedDistrict) {
    const normalizedDetected = detectedDistrict.toLowerCase().trim();
    filteredEvents = events.filter(event => {
      if (event.district) {
        const normalizedEventDistrict = event.district.toLowerCase().trim();
        return normalizedEventDistrict === normalizedDetected ||
               normalizedEventDistrict.includes(normalizedDetected) ||
               normalizedDetected.includes(normalizedEventDistrict);
      }
      const searchSpace = `${event.city || ''} ${event.neighborhood || ''}`.toLowerCase();
      return searchSpace.includes(normalizedDetected);
    });
  }

  const locations = new Set();
  filteredEvents.forEach(event => {
    if (event.city) locations.add(event.city);
    if (event.neighborhood) locations.add(event.neighborhood);
  });

  return ['All', ...locations].sort((a, b) => {
    if (a === 'All') return -1
    if (b === 'All') return 1
    return a.localeCompare(b)
  })
}

export function filterAndSortEvents(events = [], discovery = DEFAULT_DISCOVERY_STATE, now = new Date(), detectedDistrict = null) {
  const activeEvents = getActiveEvents(events, now)
  const query = discovery.searchQuery.trim().toLowerCase()

  return activeEvents
    .filter((event) => {
      const matchesSearch = query === '' || [
        event.title,
        event.description,
        event.city,
        event.neighborhood,
        event.location,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      const matchesCategory = discovery.selectedCategory === 'All' || event.category === discovery.selectedCategory
      const matchesCity = discovery.selectedCity === 'All' || event.city === discovery.selectedCity
      const matchesDate = matchesDateFilter(event.startTime, discovery.selectedDateFilter, now)

      return matchesSearch && matchesCategory && matchesCity && matchesDate
    })
    .sort((a, b) => discovery.selectedSortOrder === 'Soonest First'
      ? Number(a.startTime) - Number(b.startTime)
      : Number(b.startTime) - Number(a.startTime))
}
