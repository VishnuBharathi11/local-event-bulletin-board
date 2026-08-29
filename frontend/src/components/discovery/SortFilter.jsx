import { SORT_ORDERS } from '../../state/discoveryState.js'

export default function SortFilter({ value, onChange }) {
  return (
    <label className="discovery-field" htmlFor="event-sort-order">
      <span>Sort</span>
      <select id="event-sort-order" value={value} onChange={(event) => onChange(event.target.value)}>
        {SORT_ORDERS.map((order) => <option key={order} value={order}>{order}</option>)}
      </select>
    </label>
  )
}
