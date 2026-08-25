package com.eventhive.localevents.domain.model

data class EventConflict(
    val conflictId: String = "",
    val eventId: String = "",
    val conflictingEventId: String = "",
    val conflictScore: Int = 0,
    val reasons: List<String> = emptyList(),
    val status: EventConflictStatus = EventConflictStatus.POTENTIAL,
    val createdAt: Long = System.currentTimeMillis()
)
