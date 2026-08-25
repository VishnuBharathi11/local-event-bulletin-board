package com.eventhive.localevents.utils

import java.text.SimpleDateFormat
import java.util.*

object DateTimeUtils {
    private val dateFormatter = SimpleDateFormat("EEEE, MMM d, yyyy", Locale.getDefault())
    private val timeFormatter = SimpleDateFormat("h:mm a", Locale.getDefault())
    private val fullDateTimeFormatter = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())

    fun formatDate(timestamp: Long): String = dateFormatter.format(Date(timestamp))
    fun formatTime(timestamp: Long): String = timeFormatter.format(Date(timestamp))
    fun formatFullDateTime(timestamp: Long): String = fullDateTimeFormatter.format(Date(timestamp))
    
    fun formatEventTimeRange(start: Long, end: Long): String {
        return "${formatTime(start)} – ${formatTime(end)}"
    }
}
