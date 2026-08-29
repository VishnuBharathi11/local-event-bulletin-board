const { normalizeEvent } = require('../models/eventModel')
const { calculateActivitySimilarity } = require('./activityDomainSimilarity')

const CONFLICT_THRESHOLD = 70
const STOP_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by'])

function tokenize(text) {
  return String(text)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token))
    .reduce((tokens, token) => tokens.add(token), new Set())
}

function titleSimilarity(title1, title2) {
  const tokens1 = tokenize(title1)
  const tokens2 = tokenize(title2)
  if (tokens1.size === 0 || tokens2.size === 0) return 0

  let intersection = 0
  for (const token of tokens1) if (tokens2.has(token)) intersection += 1
  const union = new Set([...tokens1, ...tokens2]).size
  return intersection / union
}

function calculateConflict(newEventInput, existingInput) {
  const newEvent = normalizeEvent(newEventInput)
  const existing = normalizeEvent(existingInput)
  const reasons = []
  let score = 0

  let locationScore = 0
  if (newEvent.city.toLocaleLowerCase() === existing.city.toLocaleLowerCase()) {
    locationScore += 15
    reasons.push('Same city')
    if (newEvent.neighborhood.toLocaleLowerCase() === existing.neighborhood.toLocaleLowerCase()) {
      locationScore += 10
      reasons.push('Same neighborhood')
      if (newEvent.location.toLocaleLowerCase() === existing.location.toLocaleLowerCase()) {
        locationScore += 5
        reasons.push('Same specific location')
      }
    }
  }
  score += locationScore

  const overlaps = newEvent.startTime < existing.endTime && newEvent.endTime > existing.startTime
  if (overlaps) {
    score += 30
    reasons.push('Time overlaps with existing event')
  }

  if (newEvent.category === existing.category) {
    score += 20
    reasons.push('Same event category')
  }

  const similarity = titleSimilarity(newEvent.title, existing.title)
  const titleScore = Math.round(similarity * 20)
  if (titleScore > 5) {
    score += titleScore
    reasons.push('Event title appears similar')
  }

  const activity = calculateActivitySimilarity(newEvent, existing)
  if (activity.activityReason) reasons.push(activity.activityReason)

  return {
    conflictId: '',
    eventId: newEvent.eventId,
    conflictingEventId: existing.eventId,
    conflictScore: score,
    activitySimilarity: activity.activitySimilarity,
    activityDomain: activity.activityDomain,
    activityReason: activity.activityReason,
    reasons,
    status: 'POTENTIAL',
    createdAt: Date.now(),
  }
}

function detectConflicts(newEventInput, existingEvents) {
  const newEvent = normalizeEvent(newEventInput)
  return existingEvents
    .filter((existing) => existing.eventId !== newEvent.eventId)
    .map((existing) => calculateConflict(newEvent, existing))
    .filter((conflict) => conflict.conflictScore >= CONFLICT_THRESHOLD)
    .sort((a, b) => b.conflictScore - a.conflictScore)
}

module.exports = { CONFLICT_THRESHOLD, tokenize, titleSimilarity, calculateConflict, detectConflicts }
