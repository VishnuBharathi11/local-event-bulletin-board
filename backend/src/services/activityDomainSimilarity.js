const ACTIVITY_SIMILARITY_THRESHOLD = 0.6

const ACTIVITY_DOMAINS = Object.freeze({
  Sports: Object.freeze({
    football: 'Football',
    cricket: 'Cricket',
    basketball: 'Basketball',
    volleyball: 'Volleyball',
    badminton: 'Badminton',
    tournament: 'Tournament',
    match: 'Match',
    training: 'Training',
    fitness: 'Fitness',
    athletics: 'Athletics',
  }),
  Music: Object.freeze({
    music: 'Music',
    concert: 'Concert',
    singing: 'Singing',
    band: 'Band',
    guitar: 'Guitar',
    piano: 'Piano',
    dance: 'Dance',
    performance: 'Performance',
  }),
  Food: Object.freeze({
    food: 'Food',
    cooking: 'Cooking',
    cook: 'Cooking',
    recipe: 'Recipe',
    baking: 'Baking',
    restaurant: 'Restaurant',
    meal: 'Meal',
    festival: 'Festival',
  }),
  'Technology / Workshop': Object.freeze({
    workshop: 'Workshop',
    coding: 'Coding',
    programming: 'Programming',
    python: 'Python',
    java: 'Java',
    javascript: 'JavaScript',
    technology: 'Technology',
    web: 'Web',
    software: 'Software',
    ai: 'AI',
    robotics: 'Robotics',
  }),
  Community: Object.freeze({
    meetup: 'Meetup',
    community: 'Community',
    networking: 'Networking',
    discussion: 'Discussion',
    volunteer: 'Volunteer',
    social: 'Social',
  }),
  Education: Object.freeze({
    student: 'Student',
    college: 'College',
    campus: 'Campus',
    seminar: 'Seminar',
    lecture: 'Lecture',
    study: 'Study',
    academic: 'Academic',
    exam: 'Exam',
  }),
  'Garage Sale': Object.freeze({
    sale: 'Sale',
    garage: 'Garage',
    furniture: 'Furniture',
    used: 'Used',
    market: 'Market',
  }),
})

const CATEGORY_DOMAIN = Object.freeze({
  Sports: 'Sports',
  Music: 'Music',
  Food: 'Food',
  Workshops: 'Technology / Workshop',
  Meetups: 'Community',
  'Student Events': 'Education',
  'Garage Sale': 'Garage Sale',
  Community: 'Community',
})

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
  'of', 'from', 'this', 'that', 'these', 'those', 'is', 'are', 'be', 'as',
  'into', 'about', 'your', 'our', 'their', 'will', 'can', 'join', 'local',
  'event', 'events', 'session', 'sessions', 'day', 'days',
])

const TOKEN_ALIASES = Object.freeze({
  footballs: 'football',
  crickets: 'cricket',
  basketballs: 'basketball',
  volleyballs: 'volleyball',
  badminton: 'badminton',
  tournaments: 'tournament',
  matches: 'match',
  trainings: 'training',
  workouts: 'fitness',
  concerts: 'concert',
  bands: 'band',
  guitars: 'guitar',
  pianos: 'piano',
  performances: 'performance',
  recipes: 'recipe',
  restaurants: 'restaurant',
  meals: 'meal',
  workshops: 'workshop',
  coders: 'coding',
  programs: 'programming',
  technologies: 'technology',
  softwares: 'software',
  meetups: 'meetup',
  discussions: 'discussion',
  volunteers: 'volunteer',
  students: 'student',
  colleges: 'college',
  campuses: 'campus',
  seminars: 'seminar',
  lectures: 'lecture',
  studies: 'study',
  exams: 'exam',
  sales: 'sale',
  garages: 'garage',
  markets: 'market',
})

const BROAD_DOMAIN_TERMS = new Set([
  'tournament', 'match', 'training', 'fitness', 'performance', 'workshop',
  'technology', 'web', 'software', 'community', 'discussion', 'social',
  'student', 'college', 'campus', 'academic', 'sale', 'market', 'festival',
])

function normalizeActivityTokens(text) {
  return String(text ?? '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => TOKEN_ALIASES[token] || token)
    .filter((token) => token && !STOP_WORDS.has(token))
    .reduce((tokens, token) => tokens.add(token), new Set())
}

function getDomainTerms(tokens) {
  const terms = new Map()
  for (const [domain, vocabulary] of Object.entries(ACTIVITY_DOMAINS)) {
    for (const token of tokens) {
      if (Object.prototype.hasOwnProperty.call(vocabulary, token)) {
        terms.set(token, { domain, label: vocabulary[token], broad: BROAD_DOMAIN_TERMS.has(token) })
      }
    }
  }
  return terms
}

function jaccardSimilarity(tokens1, tokens2) {
  if (tokens1.size === 0 || tokens2.size === 0) return 0
  const intersection = [...tokens1].filter((token) => tokens2.has(token)).length
  const union = new Set([...tokens1, ...tokens2]).size
  return union === 0 ? 0 : intersection / union
}

function domainCoverage(terms1, terms2) {
  const focused1 = new Map([...terms1].filter(([, term]) => !term.broad))
  const focused2 = new Map([...terms2].filter(([, term]) => !term.broad))
  if (focused1.size === 0 || focused2.size === 0) return 0

  const shared = [...focused1.keys()].filter((token) => focused2.has(token)).length
  if (shared === 0) return 0

  const smallerSetSize = Math.min(focused1.size, focused2.size)
  const coverage = shared / smallerSetSize
  return 0.6 + (coverage * 0.4)
}

function selectActivityDomain(sharedTerms, terms1, terms2, category1, category2) {
  if (sharedTerms.length > 0) {
    const counts = new Map()
    for (const token of sharedTerms) {
      const domain = terms1.get(token)?.domain || terms2.get(token)?.domain
      if (domain) counts.set(domain, (counts.get(domain) || 0) + 1)
    }
    const bestDomain = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    if (bestDomain) {
      const labels = sharedTerms
        .filter((token) => (terms1.get(token)?.domain || terms2.get(token)?.domain) === bestDomain)
        .map((token) => terms1.get(token)?.label || terms2.get(token)?.label)
      return labels.slice(0, 2).join(' ')
    }
  }

  const domain1 = CATEGORY_DOMAIN[category1]
  const domain2 = CATEGORY_DOMAIN[category2]
  if (domain1 && domain1 === domain2) return domain1

  return 'Unknown / General'
}

function calculateActivitySimilarity(event1 = {}, event2 = {}) {
  const tokens1 = normalizeActivityTokens(`${event1.title ?? ''} ${event1.description ?? ''}`)
  const tokens2 = normalizeActivityTokens(`${event2.title ?? ''} ${event2.description ?? ''}`)
  const terms1 = getDomainTerms(tokens1)
  const terms2 = getDomainTerms(tokens2)
  const genericSimilarity = jaccardSimilarity(tokens1, tokens2)
  const domainSimilarity = domainCoverage(terms1, terms2)

  const rawSimilarity = domainSimilarity > 0
    ? (domainSimilarity * 0.8) + (genericSimilarity * 0.2)
    : genericSimilarity
  const activitySimilarity = Math.max(0, Math.min(1, Number(rawSimilarity.toFixed(2))))

  const sharedTerms = [...terms1.keys()].filter((token) => terms2.has(token))
  const focusedSharedTerms = sharedTerms.filter((token) => !terms1.get(token)?.broad && !terms2.get(token)?.broad)
  const activityDomain = selectActivityDomain(
    focusedSharedTerms.length > 0 ? focusedSharedTerms : sharedTerms,
    terms1,
    terms2,
    event1.category,
    event2.category,
  )

  let activityReason = ''
  if (activitySimilarity >= ACTIVITY_SIMILARITY_THRESHOLD) {
    if (activityDomain !== 'Unknown / General') {
      activityReason = `Similar activity domain: ${activityDomain}`
    } else {
      activityReason = `High activity similarity: ${Math.round(activitySimilarity * 100)}%`
    }
  }

  return {
    activitySimilarity,
    activityDomain: activitySimilarity >= ACTIVITY_SIMILARITY_THRESHOLD ? activityDomain : 'Unknown / General',
    activityReason,
  }
}

module.exports = {
  ACTIVITY_SIMILARITY_THRESHOLD,
  ACTIVITY_DOMAINS,
  normalizeActivityTokens,
  jaccardSimilarity,
  calculateActivitySimilarity,
}
