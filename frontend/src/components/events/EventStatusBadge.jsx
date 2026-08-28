const STATUS_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ACTIVE: 'Ongoing',
  EXPIRED: 'Expired',
}

export default function EventStatusBadge({ status }) {
  return (
    <span className={`event-status event-status--${String(status || '').toLowerCase()}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
