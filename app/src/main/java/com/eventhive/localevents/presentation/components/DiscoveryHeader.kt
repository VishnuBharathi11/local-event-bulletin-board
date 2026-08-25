package com.eventhive.localevents.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eventhive.localevents.presentation.state.DateFilter
import com.eventhive.localevents.presentation.state.DiscoveryState
import com.eventhive.localevents.presentation.state.SortOrder

@Composable
fun DiscoveryHeader(
    state: DiscoveryState,
    cities: List<String>,
    neighborhoods: List<String>,
    onSearchQueryChange: (String) -> Unit,
    onCategoryChange: (String) -> Unit,
    onCityChange: (String) -> Unit,
    onNeighborhoodChange: (String) -> Unit,
    onDateFilterChange: (DateFilter) -> Unit,
    onSortOrderChange: (SortOrder) -> Unit,
    onClearFilters: () -> Unit,
    modifier: Modifier = Modifier
) {
    val categories = listOf("All", "Sports", "Music", "Food", "Workshops", "Meetups", "Student Events", "Garage Sale", "Community")

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Search Bar
        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = onSearchQueryChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            placeholder = { Text("Search events, cities, neighborhoods...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            trailingIcon = {
                if (state.searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onSearchQueryChange("") }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear search")
                    }
                }
            },
            singleLine = true,
            shape = MaterialTheme.shapes.medium
        )

        // Category Chips
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(categories) { category ->
                FilterChip(
                    selected = state.selectedCategory == category,
                    onClick = { onCategoryChange(category) },
                    label = { Text(category) }
                )
            }
        }

        // Secondary Filters Row
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            item {
                FilterDropdown(
                    label = if (state.selectedCity == "All") "City" else state.selectedCity,
                    items = cities,
                    selectedItem = state.selectedCity,
                    onItemSelected = onCityChange
                )
            }
            item {
                FilterDropdown(
                    label = if (state.selectedNeighborhood == "All") "Neighborhood" else state.selectedNeighborhood,
                    items = neighborhoods,
                    selectedItem = state.selectedNeighborhood,
                    onItemSelected = onNeighborhoodChange
                )
            }
            item {
                FilterDropdown(
                    label = state.selectedDateFilter.displayName,
                    items = DateFilter.values().toList(),
                    selectedItem = state.selectedDateFilter,
                    onItemSelected = onDateFilterChange,
                    itemLabel = { it.displayName }
                )
            }
            item {
                FilterDropdown(
                    label = state.selectedSortOrder.displayName,
                    items = SortOrder.values().toList(),
                    selectedItem = state.selectedSortOrder,
                    onItemSelected = onSortOrderChange,
                    itemLabel = { it.displayName }
                )
            }
            
            if (isAnyFilterActive(state)) {
                item {
                    TextButton(onClick = onClearFilters) {
                        Text("Clear All")
                    }
                }
            }
        }
    }
}

@Composable
fun <T> FilterDropdown(
    label: String,
    items: List<T>,
    selectedItem: T,
    onItemSelected: (T) -> Unit,
    itemLabel: (T) -> String = { it.toString() }
) {
    var expanded by remember { mutableStateOf(false) }

    Box {
        AssistChip(
            onClick = { expanded = true },
            label = { Text(label) },
            trailingIcon = {
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
            }
        )
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            items.forEach { item ->
                DropdownMenuItem(
                    text = { Text(itemLabel(item)) },
                    onClick = {
                        onItemSelected(item)
                        expanded = false
                    },
                    trailingIcon = if (item == selectedItem) {
                        { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    } else null
                )
            }
        }
    }
}

private fun isAnyFilterActive(state: DiscoveryState): Boolean {
    return state.searchQuery.isNotEmpty() ||
            state.selectedCategory != "All" ||
            state.selectedCity != "All" ||
            state.selectedNeighborhood != "All" ||
            state.selectedDateFilter != DateFilter.ALL_UPCOMING ||
            state.selectedSortOrder != SortOrder.SOONEST_FIRST
}
