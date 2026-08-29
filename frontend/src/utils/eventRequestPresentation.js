export function getDemandCount(request) {
  const count = Number(request?.demandCount)
  return Number.isFinite(count) ? Math.max(0, count) : 0
}

export function getDemandThreshold(request) {
  const threshold = Number(request?.demandThreshold)
  return (Number.isFinite(threshold) && threshold > 0) ? threshold : 20
}

export function getDemandPercentage(request) {
  const count = getDemandCount(request)
  const threshold = getDemandThreshold(request)
  return threshold > 0 ? (count / threshold) * 100 : 0
}

export function getDemandProgress(request) {
  return Math.min(Math.max(getDemandPercentage(request) / 100, 0), 1)
}

export function getDemandMessage(request) {
  const count = getDemandCount(request)
  const threshold = getDemandThreshold(request)

  if (request?.status === 'CONFIRMED') return 'Event has been created.'
  if (request?.status === 'DECLINED') return 'This request was declined.'
  if (threshold <= 0) return 'Demand threshold unavailable.'
  if (count >= threshold) return 'Threshold reached.'
  if (count === 0) return 'Demand is being collected.'

  const remaining = threshold - count
  if (remaining === 1) return '1 more person to show interest.'
  if (remaining <= 2) return 'Almost there.'
  return `${remaining} more people to show interest.`
}

export function getDemandStateLabel(status) {
  switch (status) {
    case 'THRESHOLD_REACHED':
      return 'THRESHOLD REACHED'
    case 'CONFIRMED':
      return 'CONFIRMED'
    case 'DECLINED':
      return 'DECLINED'
    case 'COLLECTING_DEMAND':
    default:
      return 'COLLECTING DEMAND'
  }
}
