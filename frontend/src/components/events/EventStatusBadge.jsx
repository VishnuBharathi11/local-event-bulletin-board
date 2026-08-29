import { Check } from 'lucide-react'

const STATUS_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ACTIVE: 'Ongoing',
  EXPIRED: 'Expired',
}

export default function EventStatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase()
  const label = STATUS_LABELS[normalized] || status
  return (
    <span className={`event-status event-status--${String(status || '').toLowerCase()}`}>
      <span>{label}</span>
      {normalized === 'PUBLISHED' && <Check size={13} strokeWidth={2.6} style={{ marginLeft: '4px', flexShrink: 0 }} />}
    </span>
  )
}
