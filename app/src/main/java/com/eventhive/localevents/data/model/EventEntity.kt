package com.eventhive.localevents.data.model

import com.eventhive.localevents.domain.model.Event
import com.eventhive.localevents.domain.model.EventStatus
import com.google.firebase.firestore.DocumentId

data class EventEntity(
    @DocumentId
    val eventId: String = "",
    val title: String = "",
    val description: String = "",
    val category: String = "",
    val city: String = "",
    val neighborhood: String = "",
    val location: String = "",
    val startTime: Long = 0L,
    val endTime: Long = 0L,
    val status: String = "DRAFT",
    val rsvpCount: Int = 0,
    val organizerId: String = "",
    val createdAt: Long = 0L,
    val expireAt: Long = 0L,
    val conflictStatus: String = "NONE"
) {
    fun toDomain(): Event = Event(
        eventId = eventId,
        title = title,
        description = description,
        category = category,
        city = city,
        neighborhood = neighborhood,
        location = location,
        startTime = startTime,
        endTime = endTime,
        status = try { EventStatus.valueOf(status) } catch (e: Exception) { EventStatus.DRAFT },
        rsvpCount = rsvpCount,
        organizerId = organizerId,
        createdAt = createdAt,
        expireAt = expireAt,
        conflictStatus = conflictStatus
    )

    companion object {
        fun fromDomain(event: Event): EventEntity = EventEntity(
            eventId = event.eventId,
            title = event.title,
            description = event.description,
            category = event.category,
            city = event.city,
            neighborhood = event.neighborhood,
            location = event.location,
            startTime = event.startTime,
            endTime = event.endTime,
            status = event.status.name,
            rsvpCount = event.rsvpCount,
            organizerId = event.organizerId,
            createdAt = event.createdAt,
            expireAt = event.expireAt,
            conflictStatus = event.conflictStatus
        )
    }
}
