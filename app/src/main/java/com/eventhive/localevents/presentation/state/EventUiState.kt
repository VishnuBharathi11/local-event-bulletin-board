package com.eventhive.localevents.presentation.state

import com.eventhive.localevents.domain.model.Event

sealed interface EventUiState {
    data object Loading : EventUiState
    data class Success(val events: List<Event>) : EventUiState
    data object Empty : EventUiState
    data class Error(val message: String) : EventUiState
}
