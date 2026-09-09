import CustomSelect from '../common/CustomSelect.jsx'

export default function LocationFilters({
  city,
  cities,
  onCityChange,
}) {
  return (
    <div className="discovery-field">
      <span>City</span>
      <CustomSelect
        id="event-city"
        value={city}
        onChange={onCityChange}
        options={cities}
        iconType="city"
      />
    </div>
  )
}
