package com.eventhive.localevents.data.model

import com.google.firebase.firestore.DocumentId

data class InterestEntity(
    @DocumentId
    val interestId: String = "",
    val requestId: String = "",
    val userId: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
