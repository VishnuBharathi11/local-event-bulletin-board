export default function SearchBar({ value, onChange }) {
  return (
    <div className="discovery-search">
      <label htmlFor="event-search">Search events</label>
      <div className="discovery-search__input-wrap">
        <svg className="discovery-search__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
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
