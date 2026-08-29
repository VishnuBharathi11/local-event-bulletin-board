export default function LocationFilters({
  city,
  cities,
  onCityChange,
}) {
  return (
    <>
      <label className="discovery-field" htmlFor="event-city">
        <span>City</span>
        <select id="event-city" value={city} onChange={(event) => onCityChange(event.target.value)}>
          {cities.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    </>
  )
}
