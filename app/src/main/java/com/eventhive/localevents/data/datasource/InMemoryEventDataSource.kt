package com.eventhive.localevents.data.datasource

import com.eventhive.localevents.domain.model.*
import com.eventhive.localevents.utils.SampleData
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import java.util.UUID

class InMemoryEventDataSource : EventDataSource {
    private val events = MutableStateFlow(SampleData.events.associateBy { it.eventId }.toMutableMap())
    private val requests = MutableStateFlow<Map<String, EventRequest>>(emptyMap())
    private val interest = MutableStateFlow<Set<String>>(emptySet()) // "requestId_userId"
    private val conflicts = MutableStateFlow<Map<String, EventConflict>>(emptyMap())

    override fun getEvents(): Flow<List<Event>> = events.map { it.values.toList().sortedBy { e -> e.startTime } }

    override fun getEventById(eventId: String): Flow<Event?> = events.map { it[eventId] }

    override suspend fun saveEvent(event: Event) {
        val eventWithId = if (event.eventId.isEmpty()) {
            event.copy(eventId = UUID.randomUUID().toString())
        } else {
            event
        }
        val currentMap = events.value.toMutableMap()
        currentMap[eventWithId.eventId] = eventWithId
        events.value = currentMap
    }

    override suspend fun deleteEvent(eventId: String) {
        val currentMap = events.value.toMutableMap()
        currentMap.remove(eventId)
        events.value = currentMap
    }

    private val rsvps = MutableStateFlow<Set<String>>(emptySet()) // Store as "eventId_userId"

    override fun hasUserRSVPd(eventId: String, userId: String): Flow<Boolean> = 
        rsvps.map { it.contains("${eventId}_${userId}") }

    override suspend fun rsvpToEvent(eventId: String, userId: String) {
        val key = "${eventId}_${userId}"
        if (!rsvps.value.contains(key)) {
            rsvps.value = rsvps.value + key
            val currentMap = events.value.toMutableMap()
            val event = currentMap[eventId]
            if (event != null) {
                currentMap[eventId] = event.copy(rsvpCount = event.rsvpCount + 1)
                events.value = currentMap
            }
        }
    }

    override suspend fun removeRSVP(eventId: String, userId: String) {
        val key = "${eventId}_${userId}"
        if (rsvps.value.contains(key)) {
            rsvps.value = rsvps.value - key
            val currentMap = events.value.toMutableMap()
            val event = currentMap[eventId]
            if (event != null) {
                currentMap[eventId] = event.copy(rsvpCount = (event.rsvpCount - 1).coerceAtLeast(0))
                events.value = currentMap
            }
        }
    }

    override fun getEventRequests(): Flow<List<EventRequest>> = requests.map { it.values.filter { r -> r.status == EventRequestStatus.COLLECTING_DEMAND || r.status == EventRequestStatus.THRESHOLD_REACHED } }

    override fun getEventRequestById(requestId: String): Flow<EventRequest?> = requests.map { it[requestId] }

    override suspend fun createEventRequest(request: EventRequest) {
        val requestWithId = if (request.requestId.isEmpty()) {
            request.copy(requestId = UUID.randomUUID().toString())
        } else {
            request
        }
        val currentMap = requests.value.toMutableMap()
        currentMap[requestWithId.requestId] = requestWithId
        requests.value = currentMap
    }

    override fun hasUserExpressedInterest(requestId: String, userId: String): Flow<Boolean> = interest.map { it.contains("${requestId}_${userId}") }

    override suspend fun expressInterest(requestId: String, userId: String) {
        val key = "${requestId}_${userId}"
        if (!interest.value.contains(key)) {
            interest.value = interest.value + key
            val currentMap = requests.value.toMutableMap()
            val request = currentMap[requestId]
            if (request != null) {
                val newCount = request.demandCount + 1
                val newStatus = if (newCount >= request.demandThreshold) EventRequestStatus.THRESHOLD_REACHED else request.status
                currentMap[requestId] = request.copy(demandCount = newCount, status = newStatus)
                requests.value = currentMap
            }
        }
    }

    override suspend fun confirmEventRequest(requestId: String) {
        val request = requests.value[requestId]
        if (request != null && request.status == EventRequestStatus.THRESHOLD_REACHED) {
            // Create Event
            val newEvent = Event(
                eventId = UUID.randomUUID().toString(),
                title = request.title,
                description = request.description,
                category = request.category,
                city = request.city,
                neighborhood = request.neighborhood,
                location = request.location,
                startTime = request.startTime,
                endTime = request.endTime,
                status = EventStatus.PUBLISHED,
                organizerId = request.organizerId,
                expireAt = request.endTime
            )
            saveEvent(newEvent)
            
            // Update Request
            val currentMap = requests.value.toMutableMap()
            currentMap[requestId] = request.copy(status = EventRequestStatus.CONFIRMED)
            requests.value = currentMap
        }
    }

    override suspend fun declineEventRequest(requestId: String) {
        val request = requests.value[requestId]
        if (request != null) {
            val currentMap = requests.value.toMutableMap()
            currentMap[requestId] = request.copy(status = EventRequestStatus.DECLINED)
            requests.value = currentMap
        }
    }

    override suspend fun saveConflict(conflict: EventConflict) {
        val currentMap = conflicts.value.toMutableMap()
        val id = if (conflict.conflictId.isEmpty()) "${conflict.eventId}_${conflict.conflictingEventId}" else conflict.conflictId
        currentMap[id] = conflict.copy(conflictId = id)
        conflicts.value = currentMap
    }
}
