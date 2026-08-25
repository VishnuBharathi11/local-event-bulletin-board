package com.eventhive.localevents.domain.model

data class EventRequest(
    val requestId: String = "",
    val title: String = "",
    val description: String = "",
    val category: String = "",
    val city: String = "",
    val neighborhood: String = "",
    val location: String = "",
    val startTime: Long = 0L,
    val endTime: Long = 0L,
    val demandCount: Int = 0,
    val demandThreshold: Int = 20,
    val status: EventRequestStatus = EventRequestStatus.COLLECTING_DEMAND,
    val createdAt: Long = System.currentTimeMillis(),
    val organizerId: String = ""
)
