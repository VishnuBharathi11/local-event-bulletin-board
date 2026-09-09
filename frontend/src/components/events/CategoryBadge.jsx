import { Activity, BookOpen, GraduationCap, HeartHandshake, Music, ShoppingBag, Users, Utensils, Tag } from 'lucide-react'

const CATEGORY_ICONS = {
  Music,
  Sports: Activity,
  Food: Utensils,
  Workshops: GraduationCap,
  Meetups: Users,
  'Student Events': BookOpen,
  'Garage Sale': ShoppingBag,
  Community: HeartHandshake,
}

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

export default function CategoryBadge({ category, showIcon = true }) {
  const IconComp = (showIcon && CATEGORY_ICONS[category]) || Tag
  return (
    <span className={CATEGORY_CLASSES[category] || 'event-badge'}>
      {showIcon && IconComp && <IconComp size={12} strokeWidth={2.4} style={{ marginRight: '5px', flexShrink: 0 }} />}
      <span>{category}</span>
    </span>
  )
}
