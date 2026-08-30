import { SORT_ORDERS } from '../../state/discoveryState.js'
import CustomSelect from '../common/CustomSelect.jsx'

export default function SortFilter({ value, onChange }) {
  return (
    <div className="discovery-field">
      <span>Sort</span>
      <CustomSelect
        id="event-sort-order"
        value={value}
        onChange={onChange}
        options={SORT_ORDERS}
        iconType="sort"
      />
    </div>
  )
}
