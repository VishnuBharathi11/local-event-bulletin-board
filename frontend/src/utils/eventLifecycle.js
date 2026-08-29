export function getEventLifecycleStatus(event, now = Date.now()) {
  if (!event) return 'PUBLISHED'

  const startTime = Number(event.startTime)
  const endTime = Number(event.endTime || event.expireAt)

  if (Number.isFinite(endTime) && endTime > 0 && now >= endTime) return 'EXPIRED'
  if (Number.isFinite(startTime) && startTime > 0 && now >= startTime) return 'ACTIVE'

  return event.status || 'PUBLISHED'
}

export function getNextEventLifecycleBoundary(event, now = Date.now()) {
  const startTime = Number(event?.startTime)
  const endTime = Number(event?.endTime || event?.expireAt)

  if (Number.isFinite(startTime) && startTime > now) return startTime
  if (Number.isFinite(endTime) && endTime > now) return endTime
  return null
}
