package com.eventhive.localevents.domain.model

data class Event(
    val eventId: String = "",
    val title: String = "",
    val description: String = "",
    val category: String = "",
    val city: String = "",
    val neighborhood: String = "",
    val location: String = "",
    val startTime: Long = 0L,
    val endTime: Long = 0L,
    val status: EventStatus = EventStatus.DRAFT,
    val rsvpCount: Int = 0,
    val organizerId: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val expireAt: Long = 0L,
    val conflictStatus: String = "NONE" // NONE, POTENTIAL, RESOLVED
)
