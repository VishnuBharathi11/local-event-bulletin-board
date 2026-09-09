import { EVENT_CATEGORIES } from '../../state/discoveryState.js'

export default function CategoryFilter({ value, onChange, counts = {} }) {
  return (
    <fieldset className="category-section">
      <legend>Browse by category</legend>
      <div className="category-chips" role="group" aria-label="Event categories">
        {EVENT_CATEGORIES.map((category) => {
          const selected = value === category
          const count = counts[category] !== undefined ? counts[category] : 0

          return (
            <button
              key={category}
              className={`category-chip category-chip--${category.toLowerCase().replace(/\s+/g, '-')}${selected ? ' category-chip--selected' : ''}`}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(category)}
            >
              <span className="category-chip__label">{category}</span>
              <span className="category-chip__count">({count})</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
