package com.eventhive.localevents.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventhive.localevents.domain.model.Event
import com.eventhive.localevents.domain.model.EventConflict
import com.eventhive.localevents.presentation.viewmodel.EventViewModel

@Composable
fun ConflictWarningDialog(
    conflicts: List<EventConflict>,
    viewModel: EventViewModel,
    onReviewEvent: (String) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFF44336)) },
        title = { Text("Potential Event Conflict") },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "We found ${conflicts.size} similar event(s) that may overlap with yours.",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                LazyColumn(modifier = Modifier.heightIn(max = 300.dp)) {
                    items(conflicts) { conflict ->
                        ConflictItem(conflict, onReviewEvent)
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                    }
                }
                
                Text(
                    "You can review the existing events or choose to continue anyway.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            Button(onClick = onConfirm) {
                Text("Continue Anyway")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun ConflictItem(
    conflict: EventConflict,
    onReviewEvent: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Conflict Score: ${conflict.conflictScore}%",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.error
            )
            TextButton(onClick = { onReviewEvent(conflict.conflictingEventId) }) {
                Text("Review Event")
            }
        }
        
        Spacer(modifier = Modifier.height(4.dp))
        
        conflict.reasons.forEach { reason ->
            Text(
                text = "• $reason",
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}
