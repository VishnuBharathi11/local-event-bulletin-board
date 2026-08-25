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

async function checkAndThrow(proposedEvent) {
  const conflicts = await checkConflicts(proposedEvent)
  if (conflicts.length > 0) throw new ConflictDetectedError(conflicts)
  return conflicts
}

async function saveConflicts(conflicts, eventId) {
  for (const conflict of conflicts) {
    await eventConflictRepository.saveConflict({
      ...conflict,
      eventId,
      status: 'POTENTIAL',
      createdAt: Date.now(),
    })
  }
}

module.exports = { ConflictDetectedError, checkConflicts, checkAndThrow, saveConflicts }
