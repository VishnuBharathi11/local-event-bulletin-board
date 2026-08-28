const eventRepository = require('../repositories/eventRepository')
const eventRequestRepository = require('../repositories/eventRequestRepository')

const DEFAULT_WINDOW_DAYS = 30
const MAX_WINDOW_DAYS = 90
const MAX_RESULTS = 20

function safePositiveInteger(value, fallback, max) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, max)
}

function startOfDay(timestamp) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function daysBetween(start, end) {
  return Math.max(1, Math.ceil((end - start) / 86400000))
}

function groupCounts(items, key) {
  const counts = new Map()
  for (const item of items) {
    const value = String(item[key] || '').trim() || 'Unknown'
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function groupRsvps(items, key) {
  const totals = new Map()
  for (const item of items) {
    const value = String(item[key] || '').trim() || 'Unknown'
    totals.set(value, (totals.get(value) || 0) + Math.max(0, Number(item.rsvpCount) || 0))
  }
  return [...totals.entries()]
    .map(([name, rsvps]) => ({ name, rsvps }))
    .sort((a, b) => b.rsvps - a.rsvps || a.name.localeCompare(b.name))
}

function calculateVelocity(events, windowStart, windowEnd) {
  const midpoint = windowStart + Math.floor((windowEnd - windowStart) / 2)
  const first = events.filter((event) => Number(event.createdAt) >= windowStart && Number(event.createdAt) < midpoint).length
  const second = events.filter((event) => Number(event.createdAt) >= midpoint && Number(event.createdAt) <= windowEnd).length
  const days = daysBetween(windowStart, midpoint)
  const currentDays = daysBetween(midpoint, windowEnd)
  const firstRate = first / days
  const secondRate = second / currentDays
  const changePercent = firstRate === 0 ? (secondRate > 0 ? 100 : 0) : Math.round(((secondRate - firstRate) / firstRate) * 100)
  return { firstPeriodEvents: first, secondPeriodEvents: second, firstPeriodRatePerDay: Number(firstRate.toFixed(3)), secondPeriodRatePerDay: Number(secondRate.toFixed(3)), changePercent }
}

function buildTrendSignals(events, requests, now, windowStart, windowEnd) {
  const upcoming = events.filter((event) => Number(event.startTime) > now && Number(event.expireAt) > now)
  const categoryActivity = groupCounts(events, 'category').slice(0, MAX_RESULTS)
  const locationActivity = groupCounts(events, 'city').slice(0, MAX_RESULTS)
  const categoryRsvps = groupRsvps(events, 'category').slice(0, MAX_RESULTS)
  const locationRsvps = groupRsvps(events, 'city').slice(0, MAX_RESULTS)

  const totalRsvps = events.reduce((sum, event) => sum + Math.max(0, Number(event.rsvpCount) || 0), 0)
  const averageRsvps = events.length ? Number((totalRsvps / events.length).toFixed(2)) : 0
  const demandTotal = requests.reduce((sum, request) => sum + Math.max(0, Number(request.demandCount) || 0), 0)
  const thresholdReached = requests.filter((request) => request.status === 'THRESHOLD_REACHED').length

  return {
    eventCount: events.length,
    upcomingEventCount: upcoming.length,
    totalRsvps,
    averageRsvpsPerEvent: averageRsvps,
    communityRequestCount: requests.length,
    communityDemandTotal: demandTotal,
    thresholdReachedRequests: thresholdReached,
    eventCreationVelocity: calculateVelocity(events, windowStart, windowEnd),
    categoryActivity,
    locationActivity,
    categoryRsvps,
    locationRsvps,
  }
}

function rankHotCategories(categoryActivity, categoryRsvps) {
  const rsvpMap = new Map(categoryRsvps.map((item) => [item.name, item.rsvps]))
  return categoryActivity.map((item) => ({
    name: item.name,
    eventCount: item.count,
    rsvps: rsvpMap.get(item.name) || 0,
  })).sort((a, b) => b.rsvps - a.rsvps || b.eventCount - a.eventCount || a.name.localeCompare(b.name)).slice(0, MAX_RESULTS)
}

async function analyzeTrends({ days = DEFAULT_WINDOW_DAYS, category, city } = {}) {
  const safeDays = safePositiveInteger(days, DEFAULT_WINDOW_DAYS, MAX_WINDOW_DAYS)
  const now = Date.now()
  const windowEnd = now
  const windowStart = startOfDay(now - safeDays * 86400000)

  let events = await eventRepository.getEvents()
  events = events.filter((event) => Number(event.createdAt) >= windowStart && Number(event.createdAt) <= windowEnd)
  if (category) events = events.filter((event) => String(event.category).toLowerCase() === String(category).trim().toLowerCase())
  if (city) events = events.filter((event) => String(event.city).toLowerCase() === String(city).trim().toLowerCase())

  let requests = await eventRequestRepository.getEventRequests()
  requests = requests.filter((request) => Number(request.createdAt) >= windowStart && Number(request.createdAt) <= windowEnd)
  if (category) requests = requests.filter((request) => String(request.category).toLowerCase() === String(category).trim().toLowerCase())
  if (city) requests = requests.filter((request) => String(request.city).toLowerCase() === String(city).trim().toLowerCase())

  const signals = buildTrendSignals(events, requests, now, windowStart, windowEnd)
  const hotCategories = rankHotCategories(signals.categoryActivity, signals.categoryRsvps)
  const demandCategories = groupRsvps(requests.map((request) => ({ category: request.category, rsvpCount: request.demandCount })), 'category')
  const demandLocations = groupRsvps(requests.map((request) => ({ city: request.city, rsvpCount: request.demandCount })), 'city')

  return {
    version: 'phase2-deterministic-trends-v1',
    generatedAt: now,
    window: { days: safeDays, startTime: windowStart, endTime: windowEnd },
    filters: { category: category || null, city: city || null },
    signals,
    insights: {
      hotCategories,
      highDemandCategories: demandCategories.slice(0, MAX_RESULTS),
      highDemandCities: demandLocations.slice(0, MAX_RESULTS),
      eventSupplyVsDemand: {
        eventCount: signals.eventCount,
        communityRequestCount: signals.communityRequestCount,
        communityDemandTotal: signals.communityDemandTotal,
        thresholdReachedRequests: signals.thresholdReachedRequests,
      },
    },
  }
}

module.exports = {
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  MAX_RESULTS,
  safePositiveInteger,
  groupCounts,
  groupRsvps,
  calculateVelocity,
  rankHotCategories,
  analyzeTrends,
}
