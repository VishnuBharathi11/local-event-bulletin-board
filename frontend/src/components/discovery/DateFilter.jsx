import { DATE_FILTERS } from '../../state/discoveryState.js'

export default function DateFilter({ value, onChange }) {
  return (
    <label className="discovery-field" htmlFor="event-date-filter">
      <span>Date</span>
      <select id="event-date-filter" value={value} onChange={(event) => onChange(event.target.value)}>
        {DATE_FILTERS.map((filter) => <option key={filter} value={filter}>{filter}</option>)}
      </select>
    </label>
  )
}
