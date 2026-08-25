package com.eventhive.localevents.presentation.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eventhive.localevents.domain.model.EventRequest
import com.eventhive.localevents.domain.model.EventRequestStatus
import com.eventhive.localevents.presentation.viewmodel.EventViewModel
import com.eventhive.localevents.utils.Config
import com.eventhive.localevents.utils.DateTimeUtils
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestEventScreen(
    viewModel: EventViewModel,
    onNavigateBack: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var neighborhood by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    var selectedDate by remember { mutableStateOf(Calendar.getInstance().apply { 
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
    }.timeInMillis) }
    
    var startHour by remember { mutableIntStateOf(17) }
    var startMinute by remember { mutableIntStateOf(0) }
    var endHour by remember { mutableIntStateOf(19) }
    var endMinute by remember { mutableIntStateOf(0) }

    val categories = listOf("Sports", "Music", "Food", "Workshops", "Meetups", "Student Events", "Garage Sale", "Community")
    var showCategoryMenu by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    var showStartTimePicker by remember { mutableStateOf(false) }
    var showEndTimePicker by remember { mutableStateOf(false) }
    
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Request an Event") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize()
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Tell the community what kind of event you'd like to see happen. If enough people are interested, an organizer can confirm and publish it!",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Proposed Title") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("What's it about?") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = category,
                    onValueChange = { },
                    label = { Text("Category") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = {
                        IconButton(onClick = { showCategoryMenu = true }) {
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                    }
                )
                DropdownMenu(expanded = showCategoryMenu, onDismissRequest = { showCategoryMenu = false }) {
                    categories.forEach { cat ->
                        DropdownMenuItem(text = { Text(cat) }, onClick = { category = cat; showCategoryMenu = false })
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = DateTimeUtils.formatDate(selectedDate),
                    onValueChange = { },
                    label = { Text("Suggested Date") },
                    modifier = Modifier.weight(1f),
                    readOnly = true,
                    leadingIcon = { Icon(Icons.Default.DateRange, contentDescription = null) }
                )
                Spacer(modifier = Modifier.width(8.dp))
                Button(onClick = { showDatePicker = true }) { Text("Pick") }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = String.format(Locale.getDefault(), "%02d:%02d", startHour, startMinute),
                    onValueChange = { },
                    label = { Text("Start Time") },
                    modifier = Modifier.weight(1f),
                    readOnly = true,
                    trailingIcon = { IconButton(onClick = { showStartTimePicker = true }) { Icon(Icons.Default.ArrowDropDown, contentDescription = null) } }
                )
                OutlinedTextField(
                    value = String.format(Locale.getDefault(), "%02d:%02d", endHour, endMinute),
                    onValueChange = { },
                    label = { Text("End Time") },
                    modifier = Modifier.weight(1f),
                    readOnly = true,
                    trailingIcon = { IconButton(onClick = { showEndTimePicker = true }) { Icon(Icons.Default.ArrowDropDown, contentDescription = null) } }
                )
            }
            
            OutlinedTextField(
                value = location,
                onValueChange = { location = it },
                label = { Text("Suggested Venue") },
                modifier = Modifier.fillMaxWidth()
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = city,
                    onValueChange = { city = it },
                    label = { Text("City") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = neighborhood,
                    onValueChange = { neighborhood = it },
                    label = { Text("Neighborhood") },
                    modifier = Modifier.weight(1f)
                )
            }

            if (errorMessage != null) {
                Text(text = errorMessage!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    val startCal = Calendar.getInstance().apply {
                        timeInMillis = selectedDate
                        set(Calendar.HOUR_OF_DAY, startHour)
                        set(Calendar.MINUTE, startMinute)
                    }
                    val endCal = Calendar.getInstance().apply {
                        timeInMillis = selectedDate
                        set(Calendar.HOUR_OF_DAY, endHour)
                        set(Calendar.MINUTE, endMinute)
                    }

                    errorMessage = when {
                        title.isBlank() || description.isBlank() || category.isBlank() || city.isBlank() -> "Please fill all required fields."
                        endCal.timeInMillis <= startCal.timeInMillis -> "End time must be after start time."
                        endCal.timeInMillis <= System.currentTimeMillis() -> "Requested time must be in the future."
                        else -> null
                    }

                    if (errorMessage == null) {
                        val newRequest = EventRequest(
                            title = title,
                            description = description,
                            category = category,
                            location = location,
                            city = city,
                            neighborhood = neighborhood,
                            startTime = startCal.timeInMillis,
                            endTime = endCal.timeInMillis,
                            status = EventRequestStatus.COLLECTING_DEMAND,
                            demandThreshold = Config.DEFAULT_DEMAND_THRESHOLD
                        )
                        viewModel.createEventRequest(newRequest)
                        onNavigateBack()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium
            ) {
                Text("Submit Request", modifier = Modifier.padding(8.dp))
            }
        }
    }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(initialSelectedDateMillis = selectedDate)
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    selectedDate = datePickerState.selectedDateMillis ?: selectedDate
                    showDatePicker = false
                }) { Text("OK") }
            }
        ) { DatePicker(state = datePickerState) }
    }

    if (showStartTimePicker) {
        val timePickerState = rememberTimePickerState(initialHour = startHour, initialMinute = startMinute)
        AlertDialog(
            onDismissRequest = { showStartTimePicker = false },
            confirmButton = {
                TextButton(onClick = { startHour = timePickerState.hour; startMinute = timePickerState.minute; showStartTimePicker = false }) { Text("OK") }
            },
            text = { TimePicker(state = timePickerState) }
        )
    }

    if (showEndTimePicker) {
        val timePickerState = rememberTimePickerState(initialHour = endHour, initialMinute = endMinute)
        AlertDialog(
            onDismissRequest = { showEndTimePicker = false },
            confirmButton = {
                TextButton(onClick = { endHour = timePickerState.hour; endMinute = timePickerState.minute; showEndTimePicker = false }) { Text("OK") }
            },
            text = { TimePicker(state = timePickerState) }
        )
    }
}
