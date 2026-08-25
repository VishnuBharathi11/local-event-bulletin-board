package com.eventhive.localevents.data.model

import com.eventhive.localevents.domain.model.EventRequest
import com.eventhive.localevents.domain.model.EventRequestStatus
import com.google.firebase.firestore.DocumentId

data class EventRequestEntity(
    @DocumentId
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
    val status: String = "COLLECTING_DEMAND",
    val createdAt: Long = 0L,
    val organizerId: String = ""
) {
    fun toDomain(): EventRequest = EventRequest(
        requestId = requestId,
        title = title,
        description = description,
        category = category,
        city = city,
        neighborhood = neighborhood,
        location = location,
        startTime = startTime,
        endTime = endTime,
        demandCount = demandCount,
        demandThreshold = demandThreshold,
        status = try { EventRequestStatus.valueOf(status) } catch (e: Exception) { EventRequestStatus.COLLECTING_DEMAND },
        createdAt = createdAt,
        organizerId = organizerId
    )

    companion object {
        fun fromDomain(request: EventRequest): EventRequestEntity = EventRequestEntity(
            requestId = request.requestId,
            title = request.title,
            description = request.description,
            category = request.category,
            city = request.city,
            neighborhood = request.neighborhood,
            location = request.location,
            startTime = request.startTime,
            endTime = request.endTime,
            demandCount = request.demandCount,
            demandThreshold = request.demandThreshold,
            status = request.status.name,
            createdAt = request.createdAt,
            organizerId = request.organizerId
        )
    }
}
