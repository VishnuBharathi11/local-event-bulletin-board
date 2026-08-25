package com.eventhive.localevents.presentation.screens

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventhive.localevents.presentation.components.CategoryBadge
import com.eventhive.localevents.presentation.components.EventStatusBadge
import com.eventhive.localevents.presentation.components.LoadingState
import com.eventhive.localevents.presentation.viewmodel.EventViewModel
import com.eventhive.localevents.utils.DateTimeUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventDetailsScreen(
    eventId: String,
    viewModel: EventViewModel,
    onNavigateBack: () -> Unit
) {
    val event by viewModel.currentEvent.collectAsState()
    val isRsvpd by viewModel.isUserRSVPd.collectAsState()
    val isRsvpLoading by viewModel.isRsvpLoading.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(eventId) {
        viewModel.loadEventById(eventId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Event Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        val currentEvent = event ?: return@IconButton
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, currentEvent.title)
                            val shareText = """
                                Check out this event: ${currentEvent.title}
                                Category: ${currentEvent.category}
                                Date: ${DateTimeUtils.formatDate(currentEvent.startTime)}
                                Time: ${DateTimeUtils.formatEventTimeRange(currentEvent.startTime, currentEvent.endTime)}
                                Location: ${currentEvent.location}, ${currentEvent.neighborhood}, ${currentEvent.city}
                                
                                Open in EventHive: eventhive://event/${currentEvent.eventId}
                            """.trimIndent()
                            putExtra(Intent.EXTRA_TEXT, shareText)
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "Share Event"))
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "Share Event")
                    }
                }
            )
        }
    ) { padding ->
        val currentEvent = event
        if (currentEvent == null) {
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
                    CategoryBadge(category = currentEvent.category)
                    EventStatusBadge(status = currentEvent.status)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = currentEvent.title,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.DateRange, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = DateTimeUtils.formatDate(currentEvent.startTime),
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = DateTimeUtils.formatEventTimeRange(currentEvent.startTime, currentEvent.endTime),
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
                            text = currentEvent.location,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "${currentEvent.neighborhood}, ${currentEvent.city}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "About this event",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = currentEvent.description,
                    style = MaterialTheme.typography.bodyLarge,
                    lineHeight = MaterialTheme.typography.bodyLarge.lineHeight * 1.2
                )

                Spacer(modifier = Modifier.height(32.dp))
                
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = MaterialTheme.shapes.medium
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "${currentEvent.rsvpCount} people are going!",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                fontWeight = FontWeight.Bold
                            )
                            if (isRsvpd) {
                                Text(
                                    text = "You're on the list!",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }

                        Button(
                            onClick = { viewModel.toggleRSVP(currentEvent.eventId) },
                            enabled = !isRsvpLoading,
                            colors = if (isRsvpd) 
                                ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary) 
                                else ButtonDefaults.buttonColors()
                        ) {
                            if (isRsvpLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = MaterialTheme.colorScheme.onPrimary,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (isRsvpd) {
                                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Going")
                                    } else {
                                        Text("I'm Going")
                                    }
                                }
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedButton(
                    onClick = {
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, currentEvent.title)
                            val shareText = """
                                Join me at: ${currentEvent.title}
                                ${DateTimeUtils.formatDate(currentEvent.startTime)} @ ${currentEvent.location}
                                
                                Open: eventhive://event/${currentEvent.eventId}
                            """.trimIndent()
                            putExtra(Intent.EXTRA_TEXT, shareText)
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "Share Event"))
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Share, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Share Event")
                }
            }
        }
    }
}
