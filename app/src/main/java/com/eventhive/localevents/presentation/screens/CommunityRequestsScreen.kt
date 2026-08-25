package com.eventhive.localevents.presentation.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventhive.localevents.presentation.components.EmptyState
import com.eventhive.localevents.presentation.components.EventRequestCard
import com.eventhive.localevents.presentation.viewmodel.EventViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityRequestsScreen(
    viewModel: EventViewModel,
    onNavigateToRequestForm: () -> Unit,
    onNavigateToDetails: (String) -> Unit,
    onNavigateBack: () -> Unit
) {
    val requests by viewModel.activeRequests.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Community Requests", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToRequestForm,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Request Event") }
            )
        }
    ) { padding ->
        if (requests.isEmpty()) {
            EmptyState(
                message = "No active requests",
                description = "Want something to happen in your area? Request it!",
                modifier = Modifier.padding(padding)
            )
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Text(
                        text = "Help these events reach their demand threshold to get them confirmed!",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }
                items(requests, key = { it.requestId }) { request ->
                    EventRequestCard(
                        request = request,
                        isInterested = false, // Simplified for list, details will handle actual state
                        onInterestClick = { viewModel.toggleInterest(request.requestId) },
                        onClick = { onNavigateToDetails(request.requestId) }
                    )
                }
            }
        }
    }
}
