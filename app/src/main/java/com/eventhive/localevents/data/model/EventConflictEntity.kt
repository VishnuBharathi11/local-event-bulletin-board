package com.eventhive.localevents.data.model

import com.eventhive.localevents.domain.model.EventConflict
import com.eventhive.localevents.domain.model.EventConflictStatus
import com.google.firebase.firestore.DocumentId

data class EventConflictEntity(
    @DocumentId
    val conflictId: String = "",
    val eventId: String = "",
    val conflictingEventId: String = "",
    val conflictScore: Int = 0,
    val reasons: List<String> = emptyList(),
    val status: String = "POTENTIAL",
    val createdAt: Long = 0L
) {
    fun toDomain(): EventConflict = EventConflict(
        conflictId = conflictId,
        eventId = eventId,
        conflictingEventId = conflictingEventId,
        conflictScore = conflictScore,
        reasons = reasons,
        status = try { EventConflictStatus.valueOf(status) } catch (e: Exception) { EventConflictStatus.POTENTIAL },
        createdAt = createdAt
    )

    companion object {
        fun fromDomain(conflict: EventConflict): EventConflictEntity = EventConflictEntity(
            conflictId = conflict.conflictId,
            eventId = conflict.eventId,
            conflictingEventId = conflict.conflictingEventId,
            conflictScore = conflict.conflictScore,
            reasons = conflict.reasons,
            status = conflict.status.name,
            createdAt = conflict.createdAt
        )
    }
}
