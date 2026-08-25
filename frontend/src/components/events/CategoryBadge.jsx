const CATEGORY_CLASSES = {
  Sports: 'event-badge event-badge--sports',
  Music: 'event-badge event-badge--music',
  Food: 'event-badge event-badge--food',
  Workshops: 'event-badge event-badge--workshops',
  Meetups: 'event-badge event-badge--meetups',
  'Student Events': 'event-badge event-badge--student',
  'Garage Sale': 'event-badge event-badge--garage',
  Community: 'event-badge event-badge--community',
}

export default function CategoryBadge({ category }) {
  return <span className={CATEGORY_CLASSES[category] || 'event-badge'}>{category}</span>
}
