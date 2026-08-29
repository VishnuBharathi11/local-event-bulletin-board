import { DATE_FILTERS } from '../../state/discoveryState.js'

export default function DateFilter({ value, onChange }) {
  const isCustomDate = value && !DATE_FILTERS.includes(value)
  let customLabel = value

  if (isCustomDate) {
    const parts = String(value).split('-')
    if (parts.length === 3) {
      const year = Number(parts[0])
      const month = Number(parts[1]) - 1
      const day = Number(parts[2])
      const dateObj = new Date(year, month, day)
      if (!Number.isNaN(dateObj.getTime())) {
        customLabel = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(dateObj)
      }
    }
  }

  return (
    <label className="discovery-field" htmlFor="event-date-filter">
      <span>Date</span>
      <select id="event-date-filter" value={value} onChange={(event) => onChange(event.target.value)}>
        {isCustomDate && <option value={value}>{customLabel}</option>}
        {DATE_FILTERS.map((filter) => (
          <option key={filter} value={filter}>
            {filter}
          </option>
        ))}
      </select>
    </label>
  )
}
