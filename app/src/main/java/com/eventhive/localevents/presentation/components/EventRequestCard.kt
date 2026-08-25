package com.eventhive.localevents.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventhive.localevents.domain.model.EventRequest
import com.eventhive.localevents.domain.model.EventRequestStatus
import com.eventhive.localevents.utils.DateTimeUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventRequestCard(
    request: EventRequest,
    isInterested: Boolean,
    onInterestClick: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().padding(vertical = 8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CategoryBadge(category = request.category)
                RequestStatusBadge(status = request.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = request.title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = DateTimeUtils.formatDate(request.startTime),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(12.dp))

            DemandProgressBar(
                current = request.demandCount,
                threshold = request.demandThreshold
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${request.demandCount} / ${request.demandThreshold} interested",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Medium
                )

                if (request.status == EventRequestStatus.COLLECTING_DEMAND) {
                    Button(
                        onClick = onInterestClick,
                        enabled = !isInterested,
                        colors = if (isInterested) ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary) else ButtonDefaults.buttonColors()
                    ) {
                        if (isInterested) {
                            Text("Interested ✓")
                        } else {
                            Text("I'm Interested")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DemandProgressBar(current: Int, threshold: Int, modifier: Modifier = Modifier) {
    val progress = (current.toFloat() / threshold).coerceAtMost(1f)
    Column(modifier = modifier.fillMaxWidth()) {
        LinearProgressIndicator(
            progress = progress,
            modifier = Modifier.fillMaxWidth().height(8.dp),
            color = if (progress >= 1f) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary,
            trackColor = MaterialTheme.colorScheme.surfaceVariant
        )
        if (progress >= 1f) {
            Text(
                text = "Demand threshold reached!",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

@Composable
fun RequestStatusBadge(status: EventRequestStatus) {
    val color = when (status) {
        EventRequestStatus.COLLECTING_DEMAND -> MaterialTheme.colorScheme.secondary
        EventRequestStatus.THRESHOLD_REACHED -> MaterialTheme.colorScheme.primary
        EventRequestStatus.CONFIRMED -> Color(0xFF4CAF50)
        EventRequestStatus.DECLINED -> MaterialTheme.colorScheme.error
    }
    Surface(
        shape = MaterialTheme.shapes.extraSmall,
        color = color.copy(alpha = 0.1f),
        border = AssistChipDefaults.assistChipBorder(borderColor = color, enabled = true)
    ) {
        Text(
            text = status.name.replace("_", " "),
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = color
        )
    }
}
