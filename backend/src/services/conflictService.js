const eventRepository = require('../repositories/eventRepository')
const eventConflictRepository = require('../repositories/eventConflictRepository')
const { detectConflicts } = require('./conflictDetectionService')

class ConflictDetectedError extends Error {
  constructor(conflicts) {
    super('Potential event conflict detected')
    this.name = 'ConflictDetectedError'
    this.statusCode = 409
    this.conflicts = conflicts
  }
}

async function checkConflicts(proposedEvent) {
  const existingEvents = await eventRepository.getEvents()
  return detectConflicts(proposedEvent, existingEvents)
}

async function suggestAlternatives(proposedEvent) {
  const existingEvents = await eventRepository.getEvents()
  const suggestions = []

  const isAvailable = (slot) => {
    const conflicts = detectConflicts(slot, existingEvents)
    return conflicts.length === 0
  }

  const duration = proposedEvent.endTime - proposedEvent.startTime

  // 1. Same venue + different available time (same day)
  const hour = 3600000
  const timeOffsets = [2 * hour, -2 * hour, 4 * hour, -4 * hour]
  for (const offset of timeOffsets) {
    const newStart = proposedEvent.startTime + offset
    const slot = { ...proposedEvent, startTime: newStart, endTime: newStart + duration, expireAt: newStart + duration }
    if (newStart > Date.now() && isAvailable(slot)) {
      suggestions.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: slot.location,
        neighborhood: slot.neighborhood,
        city: slot.city,
        latitude: slot.latitude,
        longitude: slot.longitude
      })
      if (suggestions.length >= 2) break
    }
  }

  // 2. Same venue + different available date
  const day = 24 * hour
  const dateOffsets = [day, 2 * day, 7 * day]
  for (const offset of dateOffsets) {
    const newStart = proposedEvent.startTime + offset
    const slot = { ...proposedEvent, startTime: newStart, endTime: newStart + duration, expireAt: newStart + duration }
    if (isAvailable(slot)) {
      suggestions.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: slot.location,
        neighborhood: slot.neighborhood,
        city: slot.city,
        latitude: slot.latitude,
        longitude: slot.longitude
      })
      if (suggestions.length >= 4) break
    }
  }

  // 3. Different venue + same date/time
  const nearbyVenues = [...new Set(existingEvents
    .filter(e => e.city.toLowerCase() === proposedEvent.city.toLowerCase() &&
                 e.location.toLowerCase() !== proposedEvent.location.toLowerCase())
    .map(e => JSON.stringify({
      location: e.location,
      neighborhood: e.neighborhood,
      city: e.city,
      latitude: e.latitude,
      longitude: e.longitude
    })))]
    .map(s => JSON.parse(s))

  for (const venue of nearbyVenues) {
    const slot = {
      ...proposedEvent,
      location: venue.location,
      neighborhood: venue.neighborhood,
      city: venue.city,
      latitude: venue.latitude,
      longitude: venue.longitude
    }
    if (isAvailable(slot)) {
      suggestions.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: slot.location,
        neighborhood: slot.neighborhood,
        city: slot.city,
        latitude: slot.latitude,
        longitude: slot.longitude
      })
      if (suggestions.length >= 6) break
    }
  }

  return suggestions
}

async function checkAndThrow(proposedEvent) {
  const conflicts = await checkConflicts(proposedEvent)
  if (conflicts.length > 0) {
    const suggestions = await suggestAlternatives(proposedEvent)
    const error = new ConflictDetectedError(conflicts)
    error.suggestions = suggestions
    throw error
  }
  return conflicts
}

async function saveConflicts(conflicts, eventId) {
  for (const conflict of conflicts) {
    const {
      activitySimilarity: _activitySimilarity,
      activityDomain: _activityDomain,
      activityReason: _activityReason,
      ...persistedConflict
    } = conflict

    await eventConflictRepository.saveConflict({
      ...persistedConflict,
      eventId,
      status: 'POTENTIAL',
      createdAt: Date.now(),
    })
  }
}

module.exports = { ConflictDetectedError, checkConflicts, suggestAlternatives, checkAndThrow, saveConflicts }

