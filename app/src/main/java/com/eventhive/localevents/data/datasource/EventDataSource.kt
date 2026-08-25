package com.eventhive.localevents.data.datasource

import com.eventhive.localevents.domain.model.Event
import com.eventhive.localevents.domain.model.EventConflict
import com.eventhive.localevents.domain.model.EventRequest
import kotlinx.coroutines.flow.Flow

interface EventDataSource {
    fun getEvents(): Flow<List<Event>>
    fun getEventById(eventId: String): Flow<Event?>
    suspend fun saveEvent(event: Event)
    suspend fun deleteEvent(eventId: String)
    
    // RSVP operations
    fun hasUserRSVPd(eventId: String, userId: String): Flow<Boolean>
    suspend fun rsvpToEvent(eventId: String, userId: String)
    suspend fun removeRSVP(eventId: String, userId: String)

    // Event Request operations
    fun getEventRequests(): Flow<List<EventRequest>>
    fun getEventRequestById(requestId: String): Flow<EventRequest?>
    suspend fun createEventRequest(request: EventRequest)
    fun hasUserExpressedInterest(requestId: String, userId: String): Flow<Boolean>
    suspend fun expressInterest(requestId: String, userId: String)
    suspend fun confirmEventRequest(requestId: String)
    suspend fun declineEventRequest(requestId: String)

    // Conflict operations
    suspend fun saveConflict(conflict: EventConflict)
}
