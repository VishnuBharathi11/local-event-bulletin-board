import SearchBar from './SearchBar.jsx'
import CategoryFilter from './CategoryFilter.jsx'
import LocationFilters from './LocationFilters.jsx'
import DateFilter from './DateFilter.jsx'
import SortFilter from './SortFilter.jsx'

export default function DiscoveryControls({ discovery, cityOptions, neighborhoodOptions, actions }) {
  return (
    <section className="discovery-controls" aria-label="Event discovery controls">
      <div className="discovery-controls__top">
        <SearchBar value={discovery.searchQuery} onChange={actions.updateSearchQuery} />
        <button className="secondary-button discovery-clear" type="button" onClick={actions.clearFilters}>
          Clear All
        </button>
      </div>

      <div className="discovery-controls__filters">
        <CategoryFilter value={discovery.selectedCategory} onChange={actions.updateCategory} />
        <LocationFilters
          city={discovery.selectedCity}
          neighborhood={discovery.selectedNeighborhood}
          cities={cityOptions}
          neighborhoods={neighborhoodOptions}
          onCityChange={actions.updateCity}
          onNeighborhoodChange={actions.updateNeighborhood}
        />
        <DateFilter value={discovery.selectedDateFilter} onChange={actions.updateDateFilter} />
        <SortFilter value={discovery.selectedSortOrder} onChange={actions.updateSortOrder} />
      </div>
    </section>
  )
}
