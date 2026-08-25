export const EVENT_CATEGORIES = Object.freeze([
  'All',
  'Sports',
  'Music',
  'Food',
  'Workshops',
  'Meetups',
  'Student Events',
  'Garage Sale',
  'Community',
])

export const DATE_FILTERS = Object.freeze([
  'All Upcoming',
  'Today',
  'Tomorrow',
  'This Week',
  'This Weekend',
])

export const SORT_ORDERS = Object.freeze(['Soonest First', 'Latest First'])

export const DEFAULT_DISCOVERY_STATE = Object.freeze({
  searchQuery: '',
  selectedCategory: 'All',
  selectedCity: 'All',
  selectedNeighborhood: 'All',
  selectedDateFilter: 'All Upcoming',
  selectedSortOrder: 'Soonest First',
})

export function createDiscoveryState(overrides = {}) {
  return { ...DEFAULT_DISCOVERY_STATE, ...overrides }
}
