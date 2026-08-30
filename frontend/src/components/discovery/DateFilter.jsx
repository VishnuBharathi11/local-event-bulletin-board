import { DATE_FILTERS } from '../../state/discoveryState.js'
import CustomSelect from '../common/CustomSelect.jsx'

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

  const options = [
    ...(isCustomDate ? [{ value, label: customLabel }] : []),
    ...DATE_FILTERS.map((f) => ({ value: f, label: f })),
  ]

  return (
    <div className="discovery-field">
      <span>Date</span>
      <CustomSelect
        id="event-date-filter"
        value={value}
        onChange={onChange}
        options={options}
        iconType="date"
      />
    </div>
  )
}
