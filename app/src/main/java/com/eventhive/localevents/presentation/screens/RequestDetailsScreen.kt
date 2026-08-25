package com.eventhive.localevents.presentation.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventhive.localevents.domain.model.EventRequestStatus
import com.eventhive.localevents.presentation.components.CategoryBadge
import com.eventhive.localevents.presentation.components.ConflictWarningDialog
import com.eventhive.localevents.presentation.components.DemandProgressBar
import com.eventhive.localevents.presentation.components.LoadingState
import com.eventhive.localevents.presentation.components.RequestStatusBadge
import com.eventhive.localevents.presentation.viewmodel.EventViewModel
import com.eventhive.localevents.utils.DateTimeUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestDetailsScreen(
    requestId: String,
    viewModel: EventViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToDetails: (String) -> Unit
) {
    val request by viewModel.currentRequest.collectAsState()
    val isInterested by viewModel.isUserInterested.collectAsState()
    val isInterestLoading by viewModel.isInterestLoading.collectAsState()
    val conflicts by viewModel.potentialConflicts.collectAsState()

    LaunchedEffect(requestId) {
        viewModel.loadRequestById(requestId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Request Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        val currentRequest = request
        if (currentRequest == null) {
            LoadingState(modifier = Modifier.padding(padding))
        } else {
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CategoryBadge(category = currentRequest.category)
                    RequestStatusBadge(status = currentRequest.status)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = currentRequest.title,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.DateRange, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = DateTimeUtils.formatDate(currentRequest.startTime),
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = DateTimeUtils.formatEventTimeRange(currentRequest.startTime, currentRequest.endTime),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = currentRequest.location,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "${currentRequest.neighborhood}, ${currentRequest.city}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "Proposed details",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = currentRequest.description,
                    style = MaterialTheme.typography.bodyLarge
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Demand Section
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = MaterialTheme.shapes.medium
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Community Demand",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "${currentRequest.demandCount} / ${currentRequest.demandThreshold} users interested",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        DemandProgressBar(
                            current = currentRequest.demandCount,
                            threshold = currentRequest.demandThreshold
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))

                        if (currentRequest.status == EventRequestStatus.COLLECTING_DEMAND) {
                            Button(
                                onClick = { viewModel.toggleInterest(currentRequest.requestId) },
                                enabled = !isInterestLoading && !isInterested,
                                modifier = Modifier.align(Alignment.End)
                            ) {
                                if (isInterestLoading) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                } else {
                                    Text(if (isInterested) "Interested ✓" else "I'm Interested")
                                }
                            }
                        }
                    }
                }

                // Organizer Controls
                if (currentRequest.organizerId == viewModel.currentUserId && currentRequest.status == EventRequestStatus.THRESHOLD_REACHED) {
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "Organizer Controls",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Demand threshold has been reached! You can now confirm and publish this event.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Button(
                            onClick = { 
                                viewModel.confirmRequest(currentRequest.requestId)
                                onNavigateBack()
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
                        ) {
                            Text("Confirm Event")
                        }
                        OutlinedButton(
                            onClick = { 
                                viewModel.declineRequest(currentRequest.requestId)
                                onNavigateBack()
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                        ) {
                            Text("Decline")
                        }
                    }
                } else if (currentRequest.status == EventRequestStatus.CONFIRMED) {
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "This request has been confirmed and is now a published event!",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF4CAF50)
                    )
                }
            }
        }
    }

    if (conflicts.isNotEmpty()) {
        ConflictWarningDialog(
            conflicts = conflicts,
            viewModel = viewModel,
            onReviewEvent = onNavigateToDetails,
            onDismiss = { viewModel.clearPending() },
            onConfirm = { 
                viewModel.confirmPendingRequest()
                onNavigateBack()
            }
        )
    }
}
