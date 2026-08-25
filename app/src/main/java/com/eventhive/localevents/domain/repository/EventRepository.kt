package com.eventhive.localevents.domain.repository

import com.eventhive.localevents.domain.model.Event
import com.eventhive.localevents.domain.model.EventConflict
import com.eventhive.localevents.domain.model.EventRequest
import kotlinx.coroutines.flow.Flow

interface EventRepository {
    fun getEvents(): Flow<List<Event>>
    fun getEventById(eventId: String): Flow<Event?>
    suspend fun createEvent(event: Event)
    suspend fun updateEvent(event: Event)
    suspend fun deleteEvent(eventId: String)

    fun hasUserRSVPd(eventId: String, userId: String): Flow<Boolean>
    suspend fun rsvpToEvent(eventId: String, userId: String)
    suspend fun removeRSVP(eventId: String, userId: String)

    // Event Requests
    fun getEventRequests(): Flow<List<EventRequest>>
    fun getEventRequestById(requestId: String): Flow<EventRequest?>
    suspend fun createEventRequest(request: EventRequest)
    fun hasUserExpressedInterest(requestId: String, userId: String): Flow<Boolean>
    suspend fun expressInterest(requestId: String, userId: String)
    suspend fun confirmEventRequest(requestId: String)
    suspend fun declineEventRequest(requestId: String)

    // Conflicts
    suspend fun saveConflict(conflict: EventConflict)
}
