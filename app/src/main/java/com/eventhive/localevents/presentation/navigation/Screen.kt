package com.eventhive.localevents.presentation.navigation

import kotlinx.serialization.Serializable

sealed interface Screen {
    @Serializable
    data object EventBoard : Screen

    @Serializable
    data object CreateEvent : Screen

    @Serializable
    data class EventDetails(val eventId: String) : Screen

    @Serializable
    data object Calendar : Screen

    @Serializable
    data object CommunityRequests : Screen

    @Serializable
    data object RequestEvent : Screen

    @Serializable
    data class RequestDetails(val requestId: String) : Screen
}
