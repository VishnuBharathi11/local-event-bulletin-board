package com.eventhive.localevents.data.repository

import com.eventhive.localevents.data.datasource.EventDataSource
import com.eventhive.localevents.domain.model.Event
import com.eventhive.localevents.domain.model.EventConflict
import com.eventhive.localevents.domain.model.EventRequest
import com.eventhive.localevents.domain.repository.EventRepository
import kotlinx.coroutines.flow.Flow

class EventRepositoryImpl(
    private val dataSource: EventDataSource
) : EventRepository {
    override fun getEvents(): Flow<List<Event>> = dataSource.getEvents()

    override fun getEventById(eventId: String): Flow<Event?> = dataSource.getEventById(eventId)

    override suspend fun createEvent(event: Event) = dataSource.saveEvent(event)

    override suspend fun updateEvent(event: Event) = dataSource.saveEvent(event)

    override suspend fun deleteEvent(eventId: String) = dataSource.deleteEvent(eventId)

    override fun hasUserRSVPd(eventId: String, userId: String): Flow<Boolean> = 
        dataSource.hasUserRSVPd(eventId, userId)

    override suspend fun rsvpToEvent(eventId: String, userId: String) = 
        dataSource.rsvpToEvent(eventId, userId)

    override suspend fun removeRSVP(eventId: String, userId: String) = 
        dataSource.removeRSVP(eventId, userId)

    override fun getEventRequests() = dataSource.getEventRequests()
    
    override fun getEventRequestById(requestId: String) = dataSource.getEventRequestById(requestId)
    
    override suspend fun createEventRequest(request: EventRequest) = dataSource.createEventRequest(request)
    
    override fun hasUserExpressedInterest(requestId: String, userId: String) = 
        dataSource.hasUserExpressedInterest(requestId, userId)
    
    override suspend fun expressInterest(requestId: String, userId: String) = 
        dataSource.expressInterest(requestId, userId)
    
    override suspend fun confirmEventRequest(requestId: String) = 
        dataSource.confirmEventRequest(requestId)
    
    override suspend fun declineEventRequest(requestId: String) = 
        dataSource.declineEventRequest(requestId)

    override suspend fun saveConflict(conflict: EventConflict) = dataSource.saveConflict(conflict)
}
