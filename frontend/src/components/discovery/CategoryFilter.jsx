import { EVENT_CATEGORIES } from '../../state/discoveryState.js'

export default function CategoryFilter({ value, onChange }) {
  return (
    <label className="discovery-field" htmlFor="event-category">
      <span>Category</span>
      <select id="event-category" value={value} onChange={(event) => onChange(event.target.value)}>
        {EVENT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
      </select>
    </label>
  )
}
