package com.eventhive.localevents.presentation.state

enum class DateFilter(val displayName: String) {
    ALL_UPCOMING("All Upcoming"),
    TODAY("Today"),
    TOMORROW("Tomorrow"),
    THIS_WEEK("This Week"),
    THIS_WEEKEND("This Weekend")
}

enum class SortOrder(val displayName: String) {
    SOONEST_FIRST("Soonest First"),
    LATEST_FIRST("Latest First")
}

data class DiscoveryState(
    val searchQuery: String = "",
    val selectedCategory: String = "All",
    val selectedCity: String = "All",
    val selectedNeighborhood: String = "All",
    val selectedDateFilter: DateFilter = DateFilter.ALL_UPCOMING,
    val selectedSortOrder: SortOrder = SortOrder.SOONEST_FIRST
)
