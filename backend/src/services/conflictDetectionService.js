const { normalizeEvent } = require('../models/eventModel')
const { calculateActivitySimilarity } = require('./activityDomainSimilarity')

const CONFLICT_THRESHOLD = 70

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'by',
])

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

  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersection += 1
    }
  }

  const union = new Set([...tokens1, ...tokens2]).size

  return intersection / union
}

function calculateConflict(newEventInput, existingInput) {
  const newEvent = normalizeEvent(newEventInput)
  const existing = normalizeEvent(existingInput)

  const reasons = []
  let score = 0

  // Location scoring:
  // Same city = 15
  // Same neighborhood = 10
  // Same specific location = 5

  const newCity = newEvent.city.toLocaleLowerCase()
  const existingCity = existing.city.toLocaleLowerCase()

  if (newCity === existingCity) {
    score += 15
    reasons.push('Same city')

    const newNeighborhood = newEvent.neighborhood.toLocaleLowerCase()
    const existingNeighborhood = existing.neighborhood.toLocaleLowerCase()

    if (newNeighborhood === existingNeighborhood) {
      score += 10
      reasons.push('Same neighborhood')

      const newLocation = newEvent.location.toLocaleLowerCase()
      const existingLocation = existing.location.toLocaleLowerCase()

      if (newLocation === existingLocation) {
        score += 5
        reasons.push('Same specific location')
      }
    }
  }

  // Time overlap = 30 points.
  // Boundary-touching events do not overlap.

     const overlaps =
    newEvent.startTime < existing.endTime &&
    newEvent.endTime > existing.startTime

  if (overlaps) {
    score += 30
    reasons.push('Time overlaps with existing event')
  }

  const sameSpecificLocation =
    newEvent.location.trim().toLocaleLowerCase() !== '' &&
    newEvent.location.trim().toLocaleLowerCase() ===
      existing.location.trim().toLocaleLowerCase()

  // A venue cannot host two overlapping events at the same time.
  // This is a hard scheduling conflict regardless of category/title similarity.
  const isHardConflict = sameSpecificLocation && overlaps

  if (isHardConflict) {
    reasons.push('Same venue has an overlapping event')
  }

  // Same category = 20 points.

  if (newEvent.category === existing.category) {
    score += 20
    reasons.push('Same event category')
  }

  // Title similarity contributes at most 20 points.
  //
  // Only meaningful similarity contributes to the score.
  // This prevents unrelated titles such as "Unique A" and
  // "Unique B" from receiving title points.

  const similarity = titleSimilarity(newEvent.title, existing.title)
  const titleScore = Math.round(similarity * 20)

  const newTitleTokens = tokenize(newEvent.title)
  const existingTitleTokens = tokenize(existing.title)

  if (
    newTitleTokens.size >= 2 &&
    existingTitleTokens.size >= 2 &&
    similarity > 0.5 &&
    titleScore > 5
  ) {
    score += titleScore
    reasons.push('Event title appears similar')
  }

  // Activity similarity is additional intelligence.
  //
  // IMPORTANT:
  // It does NOT modify conflictScore.
  // It does NOT participate in conflict ordering.
  // The existing deterministic conflict score remains authoritative.

  const activity = calculateActivitySimilarity(newEvent, existing)

  if (activity.activityReason) {
    reasons.push(activity.activityReason)
  }

  return {

    conflictId: '',
    eventId: newEvent.eventId,
    conflictingEventId: existing.eventId,
    conflictScore: score,
    isHardConflict,
    conflictType: isHardConflict
      ? 'HARD_SCHEDULING_CONFLICT'
      : 'POTENTIAL_SCHEDULING_CONFLICT',
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
    .map((existing, index) => ({
      conflict: calculateConflict(newEvent, existing),
      index,
    }))
        .filter(({ conflict }) =>
      conflict.isHardConflict ||
      conflict.conflictScore >= CONFLICT_THRESHOLD
    )
    .sort((a, b) => {
      if (b.conflict.conflictScore !== a.conflict.conflictScore) {
        return b.conflict.conflictScore - a.conflict.conflictScore
      }

      return a.index - b.index
    })
    .map(({ conflict }) => conflict)
}

module.exports = {
  CONFLICT_THRESHOLD,
  tokenize,
  titleSimilarity,
  calculateConflict,
  detectConflicts,
}