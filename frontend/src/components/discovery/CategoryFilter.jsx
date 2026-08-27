import { EVENT_CATEGORIES } from '../../state/discoveryState.js'

export default function CategoryFilter({ value, onChange }) {
  return (
    <fieldset className="category-section">
      <legend>Browse by category</legend>
      <div className="category-chips" role="group" aria-label="Event categories">
        {EVENT_CATEGORIES.map((category) => {
          const selected = value === category
          return (
            <button
              key={category}
              className={`category-chip category-chip--${category.toLowerCase().replace(/\s+/g, '-')}${selected ? ' category-chip--selected' : ''}`}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(category)}
            >
              {category}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
