export default function LocationFilters({
  city,
  neighborhood,
  cities,
  neighborhoods,
  onCityChange,
  onNeighborhoodChange,
}) {
  return (
    <>
      <label className="discovery-field" htmlFor="event-city">
        <span>City</span>
        <select id="event-city" value={city} onChange={(event) => onCityChange(event.target.value)}>
          {cities.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="discovery-field" htmlFor="event-neighborhood">
        <span>Neighborhood</span>
        <select id="event-neighborhood" value={neighborhood} onChange={(event) => onNeighborhoodChange(event.target.value)}>
          {neighborhoods.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    </>
  )
}
