package com.eventhive.localevents.presentation.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import com.eventhive.localevents.presentation.components.*
import com.eventhive.localevents.presentation.state.EventUiState
import com.eventhive.localevents.presentation.viewmodel.EventViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventBoardScreen(
    viewModel: EventViewModel,
    onNavigateToCreate: () -> Unit,
    onNavigateToDetails: (String) -> Unit,
    onNavigateToRequests: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val discoveryState by viewModel.discoveryState.collectAsState()
    val cities by viewModel.cities.collectAsState()
    val neighborhoods by viewModel.neighborhoods.collectAsState()
    
    val scrollBehavior = TopAppBarDefaults.enterAlwaysScrollBehavior()

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            Column {
                CenterAlignedTopAppBar(
                    title = { Text("Local Events", fontWeight = androidx.compose.ui.text.font.FontWeight.Bold) },
                    actions = {
                        TextButton(onClick = onNavigateToRequests) {
                            Text("Requests")
                        }
                        IconButton(onClick = onNavigateToCreate) {
                            Icon(imageVector = Icons.Default.Add, contentDescription = "Create Event")
                        }
                    },
                    scrollBehavior = scrollBehavior
                )
                DiscoveryHeader(
                    state = discoveryState,
                    cities = cities,
                    neighborhoods = neighborhoods,
                    onSearchQueryChange = viewModel::updateSearchQuery,
                    onCategoryChange = viewModel::updateCategory,
                    onCityChange = viewModel::updateCity,
                    onNeighborhoodChange = viewModel::updateNeighborhood,
                    onDateFilterChange = viewModel::updateDateFilter,
                    onSortOrderChange = viewModel::updateSortOrder,
                    onClearFilters = viewModel::clearFilters
                )
            }
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToCreate,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Create Event") }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (val state = uiState) {
                is EventUiState.Loading -> LoadingState()
                is EventUiState.Empty -> EmptyState()
                is EventUiState.Error -> {
                    // Check if it's a "No matching events" error
                    if (state.message.contains("No matching events")) {
                        EmptyState(
                            message = "No matching events",
                            description = "Try changing your search or filters."
                        )
                    } else {
                        ErrorState(
                            message = state.message,
                            onRetry = { /* viewModel.loadEvents() is handled by init */ }
                        )
                    }
                }
                is EventUiState.Success -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(state.events, key = { it.eventId }) { event ->
                            EventCard(
                                event = event,
                                onClick = { onNavigateToDetails(event.eventId) }
                            )
                        }
                    }
                }
            }
        }
    }
}
