export default function SearchBar({ value, onChange }) {
  return (
    <div className="discovery-search">
      <label htmlFor="event-search">Search events</label>
      <input
        id="event-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by title, description, city, neighborhood, or location"
        autoComplete="off"
      />
    </div>
  )
}
