package com.eventhive.localevents.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eventhive.localevents.presentation.components.EventCard
import com.eventhive.localevents.presentation.viewmodel.EventViewModel
import com.eventhive.localevents.utils.DateTimeUtils
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen(
    viewModel: EventViewModel,
    onNavigateToDetails: (String) -> Unit
) {
    val calendarState by viewModel.calendarState.collectAsState()
    val eventsForDate by viewModel.calendarEvents.collectAsState()
    val eventDays by viewModel.monthEventDays.collectAsState()

    val monthYearFormat = remember { SimpleDateFormat("MMMM yyyy", Locale.getDefault()) }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Community Calendar", fontWeight = FontWeight.Bold) },
                actions = {
                    TextButton(onClick = { viewModel.goToToday() }) {
                        Text("Today")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            // Month Navigation
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { viewModel.previousMonth() }) {
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, contentDescription = "Previous Month")
                }
                
                Text(
                    text = monthYearFormat.format(calendarState.displayedMonth.time),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                IconButton(onClick = { viewModel.nextMonth() }) {
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = "Next Month")
                }
            }

            // Calendar Grid
            CalendarGrid(
                displayedMonth = calendarState.displayedMonth,
                selectedDate = calendarState.selectedDate,
                eventDays = eventDays,
                onDateSelected = { viewModel.selectDate(it) }
            )

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            // Events for selected date
            Column(modifier = Modifier.fillMaxSize()) {
                Text(
                    text = DateTimeUtils.formatDate(calendarState.selectedDate.timeInMillis),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                if (eventsForDate.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("No events on this date", style = MaterialTheme.typography.bodyLarge)
                            Text(
                                "Try another date to discover local events.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            Text(
                                text = "${eventsForDate.size} ${if (eventsForDate.size == 1) "Event" else "Events"}",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        items(eventsForDate) { event ->
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

@Composable
fun CalendarGrid(
    displayedMonth: Calendar,
    selectedDate: Calendar,
    eventDays: Set<Int>,
    onDateSelected: (Calendar) -> Unit
) {
    val daysOfWeek = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    
    val calendar = (displayedMonth.clone() as Calendar).apply {
        set(Calendar.DAY_OF_MONTH, 1)
    }
    
    // Adjust to Monday as start of week
    var firstDayOfWeek = calendar.get(Calendar.DAY_OF_WEEK) - 2
    if (firstDayOfWeek < 0) firstDayOfWeek += 7
    
    val daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
    val prevMonthDays = if (firstDayOfWeek > 0) {
        val prevMonth = (calendar.clone() as Calendar).apply { add(Calendar.MONTH, -1) }
        val maxDays = prevMonth.getActualMaximum(Calendar.DAY_OF_MONTH)
        (maxDays - firstDayOfWeek + 1 .. maxDays).toList()
    } else emptyList()

    val currentMonthDays = (1..daysInMonth).toList()
    
    val totalCells = 42 // 6 weeks
    val nextMonthDays = (1..totalCells - prevMonthDays.size - currentMonthDays.size).toList()

    Column(modifier = Modifier.padding(horizontal = 8.dp)) {
        // Week days header
        Row(modifier = Modifier.fillMaxWidth()) {
            daysOfWeek.forEach { day ->
                Text(
                    text = day,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))

        // Grid cells
        val allDays = (prevMonthDays.map { it to false }) + 
                     (currentMonthDays.map { it to true }) + 
                     (nextMonthDays.map { it to false })
        
        allDays.chunked(7).forEach { week ->
            Row(modifier = Modifier.fillMaxWidth()) {
                week.forEach { (day, isCurrentMonth) ->
                    val cellDate = (displayedMonth.clone() as Calendar).apply {
                        if (!isCurrentMonth && day > 20) add(Calendar.MONTH, -1)
                        else if (!isCurrentMonth) add(Calendar.MONTH, 1)
                        set(Calendar.DAY_OF_MONTH, day)
                    }
                    
                    val isSelected = isSameDay(cellDate, selectedDate)
                    val isToday = isSameDay(cellDate, Calendar.getInstance())
                    val hasEvents = isCurrentMonth && eventDays.contains(day)

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .padding(2.dp)
                            .clip(CircleShape)
                            .background(
                                if (isSelected) MaterialTheme.colorScheme.primary
                                else if (isToday) MaterialTheme.colorScheme.primaryContainer
                                else Color.Transparent
                            )
                            .clickable { onDateSelected(cellDate) },
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = day.toString(),
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimary
                                       else if (!isCurrentMonth) MaterialTheme.colorScheme.outlineVariant
                                       else MaterialTheme.colorScheme.onSurface,
                                fontWeight = if (isSelected || isToday) FontWeight.Bold else FontWeight.Normal
                            )
                            if (hasEvents) {
                                Box(
                                    modifier = Modifier
                                        .size(4.dp)
                                        .clip(CircleShape)
                                        .background(if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.primary)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun isSameDay(cal1: Calendar, cal2: Calendar): Boolean {
    return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
           cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
}
