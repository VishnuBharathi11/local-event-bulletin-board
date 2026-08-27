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

export const isPincode = (val) => /^\d{5,6}$/.test(String(val).trim());

export function getCityOptions(events = [], detectedDistrict = null) {
  if (!detectedDistrict) return ['All'];

  const normalizedDetected = detectedDistrict.toLowerCase().trim();

  // 1. Filter events to only those belonging to the user's detected district
  const districtEvents = events.filter(event => {
    if (event.district) {
      const normalizedEventDistrict = event.district.toLowerCase().trim();
      return normalizedEventDistrict === normalizedDetected ||
             normalizedEventDistrict.includes(normalizedDetected) ||
             normalizedDetected.includes(normalizedEventDistrict);
    }
    const searchSpace = `${event.city || ''} ${event.neighborhood || ''}`.toLowerCase();
    return searchSpace.includes(normalizedDetected);
  });

  const locations = new Set();

  const isLegitimateLocality = (name) => {
    if (!name || typeof name !== 'string') return false;
    const lower = name.toLowerCase().trim();

    // 1. Exclude if it's the detected district name itself
    if (lower === normalizedDetected) return false;

    // 2. Exclude Pincodes (must never be visible in UI)
    if (isPincode(lower)) return false;

    // 3. Exclude landmarks/venues based on common keywords
    const invalidKeywords = [
      'near ', 'hospital', 'tower', 'mall', 'station', 'building', 'hotel',
      'college', 'university', 'ground', 'complex', 'plaza', 'house',
      'shop', 'market', 'office', 'room', 'hall', 'center', 'centre',
      'road', 'street', 'lane', 'avenue', 'apartment', 'flat', 'villa'
    ];

    if (invalidKeywords.some(keyword => lower.includes(lower.startsWith(keyword) ? keyword : ' ' + keyword))) {
       return false;
    }

    // 4. Exclude if it looks like a specific address (starts with number)
    if (/^\d/.test(lower)) return false;

    // 5. Length check
    if (name.length > 30) return false;

    return true;
  };

  districtEvents.forEach(event => {
    if (event.city && isLegitimateLocality(event.city)) {
      locations.add(event.city.trim());
    }
    if (event.neighborhood && isLegitimateLocality(event.neighborhood)) {
      locations.add(event.neighborhood.trim());
    }
  });

  const sortedLocations = Array.from(locations).sort((a, b) => a.localeCompare(b));

  return ['All', ...sortedLocations];
}

export function filterAndSortEvents(events = [], discovery = DEFAULT_DISCOVERY_STATE, now = new Date(), detectedDistrict = null) {
  const activeEvents = getActiveEvents(events, now)
  const query = discovery.searchQuery.trim().toLowerCase()
  const selectedCity = discovery.selectedCity

  // Internal accurate matching logic:
  // Identify all values (names and pincodes) that map to the selected city name.
  let allowedInternalValues = new Set();
  if (selectedCity !== 'All') {
    allowedInternalValues.add(selectedCity.toLowerCase().trim());

    // Scan all events to find associated pincodes/alternate names for internal matching
    activeEvents.forEach(e => {
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

  return activeEvents
    .filter((event) => {
      // 1. District Filtering (Automatic)
      if (detectedDistrict) {
        const normalizedDetected = detectedDistrict.toLowerCase().trim();
        if (event.district) {
          const normalizedEventDistrict = event.district.toLowerCase().trim();
          if (normalizedEventDistrict !== normalizedDetected && !normalizedEventDistrict.includes(normalizedDetected) && !normalizedDetected.includes(normalizedEventDistrict)) {
             return false;
          }
        } else {
          const searchSpace = `${event.city || ''} ${event.neighborhood || ''}`.toLowerCase()
          if (!searchSpace.includes(normalizedDetected)) return false
        }
      }

      // 2. Search query
      const matchesSearch = query === '' || [
        event.title,
        event.description,
        event.city,
        event.neighborhood,
        event.location,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      // 3. Category
      const matchesCategory = discovery.selectedCategory === 'All' || event.category === discovery.selectedCategory

      // 4. City/Locality (Using internal accurate values if selected)
      let matchesCity = selectedCity === 'All';
      if (!matchesCity) {
        const eventCity = String(event.city || '').toLowerCase().trim();
        const eventNeighborhood = String(event.neighborhood || '').toLowerCase().trim();
        matchesCity = allowedInternalValues.has(eventCity) || allowedInternalValues.has(eventNeighborhood);
      }

      // 5. Date
      const matchesDate = matchesDateFilter(event.startTime, discovery.selectedDateFilter, now)

      return matchesSearch && matchesCategory && matchesCity && matchesDate
    })
    .sort((a, b) => discovery.selectedSortOrder === 'Soonest First'
      ? Number(a.startTime) - Number(b.startTime)
      : Number(b.startTime) - Number(a.startTime))
}
