package com.eventhive.localevents.data.model

import com.google.firebase.firestore.DocumentId

data class RSVPEntity(
    @DocumentId
    val rsvpId: String = "",
    val eventId: String = "",
    val userId: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
