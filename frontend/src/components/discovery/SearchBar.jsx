export default function SearchBar({ value, onChange }) {
  return (
    <div className="discovery-search">
      <label htmlFor="event-search">Search events</label>
      <div className="discovery-search__input-wrap">
        <span className="discovery-search__icon" aria-hidden="true">⌕</span>
        <input
          id="event-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by title, description, city, neighborhood, or location"
          autoComplete="off"
        />
      </div>
    </div>
  )
}
