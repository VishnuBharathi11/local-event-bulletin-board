import SearchBar from './SearchBar.jsx'
import CategoryFilter from './CategoryFilter.jsx'
import LocationFilters from './LocationFilters.jsx'
import DateFilter from './DateFilter.jsx'
import SortFilter from './SortFilter.jsx'

export default function DiscoveryControls({ discovery, cityOptions, actions, categoryCounts }) {
  return (
    <section className="discovery-controls" aria-label="Event discovery controls">
      <div className="discovery-controls__top">
        <SearchBar value={discovery.searchQuery} onChange={actions.updateSearchQuery} />
        <button className="secondary-button discovery-clear" type="button" onClick={actions.clearFilters}>
          Clear All
        </button>
      </div>

      <CategoryFilter
        value={discovery.selectedCategory}
        onChange={actions.updateCategory}
        counts={categoryCounts}
      />

      <div className="discovery-controls__filters">
        <LocationFilters
          city={discovery.selectedCity}
          cities={cityOptions}
          onCityChange={actions.updateCity}
        />
        <DateFilter value={discovery.selectedDateFilter} onChange={actions.updateDateFilter} />
        <SortFilter value={discovery.selectedSortOrder} onChange={actions.updateSortOrder} />
      </div>
    </section>
  )
}
