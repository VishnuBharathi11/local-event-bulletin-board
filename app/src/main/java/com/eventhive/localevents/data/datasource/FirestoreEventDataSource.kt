package com.eventhive.localevents.data.datasource

import com.eventhive.localevents.data.model.*
import com.eventhive.localevents.domain.model.*
import com.eventhive.localevents.utils.Config
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class FirestoreEventDataSource(
    private val firestore: FirebaseFirestore
) : EventDataSource {

    private val eventCollection = firestore.collection("events")
    private val requestCollection = firestore.collection("eventRequests")
    private val interestCollection = firestore.collection("eventRequestInterest")

    override fun getEvents(): Flow<List<Event>> = callbackFlow {
        val subscription = eventCollection
            .orderBy("startTime", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val events = snapshot.toObjects(EventEntity::class.java).map { it.toDomain() }
                    trySend(events)
                }
            }
        awaitClose { subscription.remove() }
    }

    override fun getEventById(eventId: String): Flow<Event?> = callbackFlow {
        val subscription = eventCollection.document(eventId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    trySend(snapshot.toObject(EventEntity::class.java)?.toDomain())
                }
            }
        awaitClose { subscription.remove() }
    }

    override suspend fun saveEvent(event: Event) {
        val entity = EventEntity.fromDomain(event)
        if (entity.eventId.isEmpty()) {
            val newDocRef = eventCollection.document()
            val entityWithId = entity.copy(eventId = newDocRef.id)
            newDocRef.set(entityWithId).await()
        } else {
            eventCollection.document(entity.eventId).set(entity).await()
        }
    }

    override suspend fun deleteEvent(eventId: String) {
        firestore.runBatch { batch ->
            batch.delete(eventCollection.document(eventId))
            // Note: In a production app, we would also delete all RSVPs for this event.
            // For MVP, we'll keep it simple or implement a cloud function later.
        }.await()
    }

    override fun hasUserRSVPd(eventId: String, userId: String): Flow<Boolean> = callbackFlow {
        val subscription = firestore.collection("eventRSVPs")
            .whereEqualTo("eventId", eventId)
            .whereEqualTo("userId", userId)
            .limit(1)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                trySend(snapshot != null && !snapshot.isEmpty)
            }
        awaitClose { subscription.remove() }
    }

    override suspend fun rsvpToEvent(eventId: String, userId: String) {
        val rsvpRef = firestore.collection("eventRSVPs").document("${eventId}_${userId}")
        val eventRef = eventCollection.document(eventId)

        firestore.runTransaction { transaction ->
            val rsvpSnapshot = transaction.get(rsvpRef)
            if (!rsvpSnapshot.exists()) {
                val rsvp = RSVPEntity(
                    rsvpId = "${eventId}_${userId}",
                    eventId = eventId,
                    userId = userId
                )
                transaction.set(rsvpRef, rsvp)
                
                val eventSnapshot = transaction.get(eventRef)
                val currentCount = eventSnapshot.getLong("rsvpCount") ?: 0
                transaction.update(eventRef, "rsvpCount", currentCount + 1)
            }
        }.await()
    }

    override suspend fun removeRSVP(eventId: String, userId: String) {
        val rsvpRef = firestore.collection("eventRSVPs").document("${eventId}_${userId}")
        val eventRef = eventCollection.document(eventId)

        firestore.runTransaction { transaction ->
            val rsvpSnapshot = transaction.get(rsvpRef)
            if (rsvpSnapshot.exists()) {
                transaction.delete(rsvpRef)
                
                val eventSnapshot = transaction.get(eventRef)
                val currentCount = eventSnapshot.getLong("rsvpCount") ?: 0
                val newCount = (currentCount - 1).coerceAtLeast(0)
                transaction.update(eventRef, "rsvpCount", newCount)
            }
        }.await()
    }

    override fun getEventRequests(): Flow<List<EventRequest>> = callbackFlow {
        val subscription = requestCollection
            .whereIn("status", listOf("COLLECTING_DEMAND", "THRESHOLD_REACHED"))
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val requests = snapshot.toObjects(EventRequestEntity::class.java).map { it.toDomain() }
                    trySend(requests)
                }
            }
        awaitClose { subscription.remove() }
    }

    override fun getEventRequestById(requestId: String): Flow<EventRequest?> = callbackFlow {
        val subscription = requestCollection.document(requestId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    trySend(snapshot.toObject(EventRequestEntity::class.java)?.toDomain())
                }
            }
        awaitClose { subscription.remove() }
    }

    override suspend fun createEventRequest(request: EventRequest) {
        val entity = EventRequestEntity.fromDomain(request)
        if (entity.requestId.isEmpty()) {
            val newDocRef = requestCollection.document()
            val entityWithId = entity.copy(requestId = newDocRef.id)
            newDocRef.set(entityWithId).await()
        } else {
            requestCollection.document(entity.requestId).set(entity).await()
        }
    }

    override fun hasUserExpressedInterest(requestId: String, userId: String): Flow<Boolean> = callbackFlow {
        val subscription = interestCollection.document("${requestId}_${userId}")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                trySend(snapshot != null && snapshot.exists())
            }
        awaitClose { subscription.remove() }
    }

    override suspend fun expressInterest(requestId: String, userId: String) {
        val interestRef = interestCollection.document("${requestId}_${userId}")
        val requestRef = requestCollection.document(requestId)

        firestore.runTransaction { transaction ->
            val interestSnapshot = transaction.get(interestRef)
            if (!interestSnapshot.exists()) {
                val interest = InterestEntity(
                    interestId = "${requestId}_${userId}",
                    requestId = requestId,
                    userId = userId
                )
                transaction.set(interestRef, interest)
                
                val requestSnapshot = transaction.get(requestRef)
                val currentCount = requestSnapshot.getLong("demandCount") ?: 0
                val threshold = requestSnapshot.getLong("demandThreshold") ?: Config.DEFAULT_DEMAND_THRESHOLD.toLong()
                val newCount = currentCount + 1
                
                transaction.update(requestRef, "demandCount", newCount)
                
                if (newCount >= threshold) {
                    transaction.update(requestRef, "status", EventRequestStatus.THRESHOLD_REACHED.name)
                }
            }
        }.await()
    }

    override suspend fun confirmEventRequest(requestId: String) {
        val requestRef = requestCollection.document(requestId)
        val eventCollection = firestore.collection("events")

        firestore.runTransaction { transaction ->
            val requestSnapshot = transaction.get(requestRef)
            val request = requestSnapshot.toObject(EventRequestEntity::class.java)
            
            if (request != null && request.status == EventRequestStatus.THRESHOLD_REACHED.name) {
                // 1. Create Normal Event
                val newEventRef = eventCollection.document()
                val event = EventEntity(
                    eventId = newEventRef.id,
                    title = request.title,
                    description = request.description,
                    category = request.category,
                    city = request.city,
                    neighborhood = request.neighborhood,
                    location = request.location,
                    startTime = request.startTime,
                    endTime = request.endTime,
                    status = EventStatus.PUBLISHED.name,
                    rsvpCount = 0,
                    organizerId = request.organizerId,
                    createdAt = System.currentTimeMillis(),
                    expireAt = request.endTime,
                    conflictStatus = "NONE"
                )
                transaction.set(newEventRef, event)
                
                // 2. Mark Request as CONFIRMED
                transaction.update(requestRef, "status", EventRequestStatus.CONFIRMED.name)
            }
        }.await()
    }

    override suspend fun declineEventRequest(requestId: String) {
        requestCollection.document(requestId)
            .update("status", EventRequestStatus.DECLINED.name)
            .await()
    }

    override suspend fun saveConflict(conflict: EventConflict) {
        val entity = EventConflictEntity.fromDomain(conflict)
        val docId = if (entity.conflictId.isEmpty()) {
            "${conflict.eventId}_${conflict.conflictingEventId}"
        } else {
            entity.conflictId
        }
        firestore.collection("eventConflicts").document(docId).set(entity).await()
    }
}
