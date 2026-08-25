package com.eventhive.localevents.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.eventhive.localevents.domain.model.*
import com.eventhive.localevents.domain.repository.EventRepository
import com.eventhive.localevents.domain.usecase.ConflictDetectionUseCase
import com.eventhive.localevents.presentation.state.*
import com.eventhive.localevents.utils.CurrentUserProvider
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*

class EventViewModel(
    private val repository: EventRepository,
    private val currentUserProvider: CurrentUserProvider,
    private val conflictDetectionUseCase: ConflictDetectionUseCase
) : ViewModel() {

    val currentUserId = currentUserProvider.getCurrentUserId()

    private val _discoveryState = MutableStateFlow(DiscoveryState())
    val discoveryState: StateFlow<DiscoveryState> = _discoveryState.asStateFlow()

    private val _calendarState = MutableStateFlow(CalendarState())
    val calendarState: StateFlow<CalendarState> = _calendarState.asStateFlow()

    private val _rawEvents = MutableStateFlow<List<Event>>(emptyList())
    private val _rawRequests = MutableStateFlow<List<EventRequest>>(emptyList())
    private val _operationError = MutableStateFlow<String?>(null)

    val activeRequests: StateFlow<List<EventRequest>> = _rawRequests.asStateFlow()

    private val _activeEvents = _rawEvents.map { events ->
        val now = System.currentTimeMillis()
        events.map { event ->
            if (now >= event.expireAt) event.copy(status = EventStatus.EXPIRED) else event
        }.filter { it.status != EventStatus.EXPIRED }
    }
    
    val uiState: StateFlow<EventUiState> = combine(
        _activeEvents,
        _discoveryState,
        _operationError
    ) { events, discovery, error ->
        if (error != null) {
            return@combine EventUiState.Error(error)
        }
        
        if (events.isEmpty() && _rawEvents.value.isNotEmpty()) {
            // All events are expired or filtered out
            return@combine EventUiState.Empty
        }
        
        if (events.isEmpty() && _rawEvents.value.isEmpty()) {
            return@combine EventUiState.Empty
        }

        val filtered = filterAndSortEvents(events, discovery)
        
        if (filtered.isEmpty() && (discovery != DiscoveryState() || _rawEvents.value.isNotEmpty())) {
            EventUiState.Error("No matching events found. Try changing your search or filters.")
        } else if (filtered.isEmpty()) {
            EventUiState.Empty
        } else {
            EventUiState.Success(filtered)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), EventUiState.Loading)

    val calendarEvents: StateFlow<List<Event>> = combine(_activeEvents, _calendarState) { events, calState ->
        events.filter { event ->
            val eventCal = Calendar.getInstance().apply { timeInMillis = event.startTime }
            isSameDay(eventCal, calState.selectedDate)
        }.sortedBy { it.startTime }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val monthEventDays: StateFlow<Set<Int>> = combine(_activeEvents, _calendarState) { events, calState ->
        events.filter { event ->
            val eventCal = Calendar.getInstance().apply { timeInMillis = event.startTime }
            eventCal.get(Calendar.MONTH) == calState.displayedMonth.get(Calendar.MONTH) &&
            eventCal.get(Calendar.YEAR) == calState.displayedMonth.get(Calendar.YEAR)
        }.map { 
            val eventCal = Calendar.getInstance().apply { timeInMillis = it.startTime }
            eventCal.get(Calendar.DAY_OF_MONTH)
        }.toSet()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet())

    val cities: StateFlow<List<String>> = _activeEvents.map { events ->
        listOf("All") + events.map { it.city }.distinct().sorted()
    }.stateIn(viewModelScope, SharingStarted.Eagerly, listOf("All"))

    val neighborhoods: StateFlow<List<String>> = combine(_rawEvents, _discoveryState) { events, discovery ->
        val filteredByCity = if (discovery.selectedCity == "All") events else events.filter { it.city == discovery.selectedCity }
        listOf("All") + filteredByCity.map { it.neighborhood }.distinct().sorted()
    }.stateIn(viewModelScope, SharingStarted.Eagerly, listOf("All"))

    init {
        observeEvents()
        observeRequests()
    }

    private fun observeEvents() {
        viewModelScope.launch {
            repository.getEvents()
                .catch { e ->
                    _operationError.value = handleError(e)
                }
                .collect { events ->
                    _rawEvents.value = events
                }
        }
    }

    private fun observeRequests() {
        viewModelScope.launch {
            repository.getEventRequests()
                .catch { e -> _operationError.value = handleError(e) }
                .collect { requests ->
                    _rawRequests.value = requests
                }
        }
    }

    fun updateSearchQuery(query: String) {
        _discoveryState.value = _discoveryState.value.copy(searchQuery = query)
    }

    fun updateCategory(category: String) {
        _discoveryState.value = _discoveryState.value.copy(selectedCategory = category)
    }

    fun updateCity(city: String) {
        _discoveryState.value = _discoveryState.value.copy(selectedCity = city, selectedNeighborhood = "All")
    }

    fun updateNeighborhood(neighborhood: String) {
        _discoveryState.value = _discoveryState.value.copy(selectedNeighborhood = neighborhood)
    }

    fun updateDateFilter(filter: DateFilter) {
        _discoveryState.value = _discoveryState.value.copy(selectedDateFilter = filter)
    }

    fun updateSortOrder(order: SortOrder) {
        _discoveryState.value = _discoveryState.value.copy(selectedSortOrder = order)
    }

    fun nextMonth() {
        val next = (_calendarState.value.displayedMonth.clone() as Calendar).apply {
            add(Calendar.MONTH, 1)
        }
        _calendarState.value = _calendarState.value.copy(displayedMonth = next)
    }

    fun previousMonth() {
        val prev = (_calendarState.value.displayedMonth.clone() as Calendar).apply {
            add(Calendar.MONTH, -1)
        }
        _calendarState.value = _calendarState.value.copy(displayedMonth = prev)
    }

    fun selectDate(date: Calendar) {
        _calendarState.value = _calendarState.value.copy(selectedDate = date)
    }

    fun goToToday() {
        val today = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val currentMonth = (today.clone() as Calendar).apply {
            set(Calendar.DAY_OF_MONTH, 1)
        }
        _calendarState.value = CalendarState(displayedMonth = currentMonth, selectedDate = today)
    }

    fun clearFilters() {
        _discoveryState.value = DiscoveryState()
        _operationError.value = null
    }

    fun resetError() {
        _operationError.value = null
    }

    private fun filterAndSortEvents(events: List<Event>, discovery: DiscoveryState): List<Event> {
        return events.filter { event ->
            // Search filter
            val matchesSearch = discovery.searchQuery.isBlank() || 
                event.title.contains(discovery.searchQuery, ignoreCase = true) ||
                event.description.contains(discovery.searchQuery, ignoreCase = true) ||
                event.city.contains(discovery.searchQuery, ignoreCase = true) ||
                event.neighborhood.contains(discovery.searchQuery, ignoreCase = true) ||
                event.location.contains(discovery.searchQuery, ignoreCase = true)

            // Category filter
            val matchesCategory = discovery.selectedCategory == "All" || event.category == discovery.selectedCategory

            // Location filter
            val matchesCity = discovery.selectedCity == "All" || event.city == discovery.selectedCity
            val matchesNeighborhood = discovery.selectedNeighborhood == "All" || event.neighborhood == discovery.selectedNeighborhood

            // Date filter
            val matchesDate = matchesDateFilter(event.startTime, discovery.selectedDateFilter)

            matchesSearch && matchesCategory && matchesCity && matchesNeighborhood && matchesDate
        }.sortedWith { a, b ->
            if (discovery.selectedSortOrder == SortOrder.SOONEST_FIRST) {
                a.startTime.compareTo(b.startTime)
            } else {
                b.startTime.compareTo(a.startTime)
            }
        }
    }

    private fun matchesDateFilter(startTime: Long, filter: DateFilter): Boolean {
        val now = Calendar.getInstance()
        val eventCal = Calendar.getInstance().apply { timeInMillis = startTime }
        
        // Start of today
        val startOfToday = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        if (eventCal.before(startOfToday)) return false // Exclude past events for now

        return when (filter) {
            DateFilter.ALL_UPCOMING -> true
            DateFilter.TODAY -> isSameDay(eventCal, now)
            DateFilter.TOMORROW -> {
                val tomorrow = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 1) }
                isSameDay(eventCal, tomorrow)
            }
            DateFilter.THIS_WEEK -> {
                val nextWeek = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 7) }
                eventCal.before(nextWeek)
            }
            DateFilter.THIS_WEEKEND -> {
                val dayOfWeek = eventCal.get(Calendar.DAY_OF_WEEK)
                dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY
            }
        }
    }

    private fun isSameDay(cal1: Calendar, cal2: Calendar): Boolean {
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
               cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
    }

    fun createEvent(event: Event) {
        viewModelScope.launch {
            try {
                // 1. Check for conflicts
                val conflicts = conflictDetectionUseCase.detectConflicts(event, _rawEvents.value)
                if (conflicts.isNotEmpty()) {
                    pendingEvent = event
                    _potentialConflicts.value = conflicts
                } else {
                    repository.createEvent(event)
                }
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    fun confirmConflictAndCreate() {
        val event = pendingEvent ?: return
        viewModelScope.launch {
            try {
                repository.createEvent(event)
                // Save conflict relationships
                _potentialConflicts.value.forEach { conflict ->
                    repository.saveConflict(conflict.copy(eventId = event.eventId))
                }
                clearPending()
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    fun updateEvent(event: Event) {
        viewModelScope.launch {
            try {
                repository.updateEvent(event)
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    fun deleteEvent(eventId: String) {
        viewModelScope.launch {
            try {
                repository.deleteEvent(eventId)
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    private val _currentEvent = MutableStateFlow<Event?>(null)
    val currentEvent: StateFlow<Event?> = _currentEvent.asStateFlow()

    private val _isUserRSVPd = MutableStateFlow(false)
    val isUserRSVPd: StateFlow<Boolean> = _isUserRSVPd.asStateFlow()

    private val _isUserInterested = MutableStateFlow(false)
    val isUserInterested: StateFlow<Boolean> = _isUserInterested.asStateFlow()

    private val _currentRequest = MutableStateFlow<EventRequest?>(null)
    val currentRequest: StateFlow<EventRequest?> = _currentRequest.asStateFlow()

    private val _isRsvpLoading = MutableStateFlow(false)
    val isRsvpLoading: StateFlow<Boolean> = _isRsvpLoading.asStateFlow()

    private val _isInterestLoading = MutableStateFlow(false)
    val isInterestLoading: StateFlow<Boolean> = _isInterestLoading.asStateFlow()

    private val _potentialConflicts = MutableStateFlow<List<EventConflict>>(emptyList())
    val potentialConflicts: StateFlow<List<EventConflict>> = _potentialConflicts.asStateFlow()

    private var pendingEvent: Event? = null
    private var pendingRequestId: String? = null

    fun loadEventById(eventId: String) {
        viewModelScope.launch {
            repository.getEventById(eventId)
                .catch { e ->
                    _operationError.value = handleError(e)
                }
                .collect { event ->
                    _currentEvent.value = event
                }
        }
        
        viewModelScope.launch {
            repository.hasUserRSVPd(eventId, currentUserId)
                .catch { e -> /* handle or log */ }
                .collect { isRsvpd ->
                    _isUserRSVPd.value = isRsvpd
                }
        }
    }

    fun loadRequestById(requestId: String) {
        viewModelScope.launch {
            repository.getEventRequestById(requestId)
                .catch { e -> _operationError.value = handleError(e) }
                .collect { request ->
                    _currentRequest.value = request
                }
        }

        viewModelScope.launch {
            repository.hasUserExpressedInterest(requestId, currentUserId)
                .catch { e -> }
                .collect { interested ->
                    _isUserInterested.value = interested
                }
        }
    }

    fun toggleInterest(requestId: String) {
        if (_isInterestLoading.value || _isUserInterested.value) return

        viewModelScope.launch {
            _isInterestLoading.value = true
            try {
                repository.expressInterest(requestId, currentUserId)
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            } finally {
                _isInterestLoading.value = false
            }
        }
    }

    fun createEventRequest(request: EventRequest) {
        viewModelScope.launch {
            try {
                repository.createEventRequest(request.copy(organizerId = currentUserId))
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    fun confirmRequest(requestId: String) {
        viewModelScope.launch {
            try {
                val request = _rawRequests.value.find { it.requestId == requestId }
                if (request != null) {
                    // Check conflicts before confirmation
                    val dummyEvent = Event(
                        title = request.title,
                        category = request.category,
                        startTime = request.startTime,
                        endTime = request.endTime,
                        location = request.location,
                        city = request.city,
                        neighborhood = request.neighborhood
                    )
                    val conflicts = conflictDetectionUseCase.detectConflicts(dummyEvent, _rawEvents.value)
                    if (conflicts.isNotEmpty()) {
                        pendingRequestId = requestId
                        _potentialConflicts.value = conflicts
                    } else {
                        repository.confirmEventRequest(requestId)
                    }
                }
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    fun confirmPendingRequest() {
        val requestId = pendingRequestId ?: return
        viewModelScope.launch {
            try {
                repository.confirmEventRequest(requestId)
                clearPending()
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    fun clearPending() {
        pendingEvent = null
        pendingRequestId = null
        _potentialConflicts.value = emptyList()
    }

    fun declineRequest(requestId: String) {
        viewModelScope.launch {
            try {
                repository.declineEventRequest(requestId)
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    fun toggleRSVP(eventId: String) {
        if (_isRsvpLoading.value) return

        viewModelScope.launch {
            _isRsvpLoading.value = true
            try {
                if (_isUserRSVPd.value) {
                    repository.removeRSVP(eventId, currentUserId)
                } else {
                    repository.rsvpToEvent(eventId, currentUserId)
                }
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            } finally {
                _isRsvpLoading.value = false
            }
        }
    }

    fun seedSampleData() {
        viewModelScope.launch {
            try {
                com.eventhive.localevents.utils.SampleData.events.forEach { event ->
                    repository.createEvent(event)
                }
                com.eventhive.localevents.utils.SampleData.requests.forEach { request ->
                    repository.createEventRequest(request)
                }
            } catch (e: Exception) {
                _operationError.value = handleError(e)
            }
        }
    }

    private fun handleError(t: Throwable): String {
        // Map common Firestore errors to user-friendly messages if needed
        return when {
            t.message?.contains("permission-denied") == true -> "You don't have permission to perform this action."
            t.message?.contains("unavailable") == true -> "Service is currently unavailable. Please check your internet connection."
            else -> t.message ?: "An unexpected error occurred"
        }
    }

    companion object {
        fun provideFactory(
            repository: EventRepository,
            currentUserProvider: CurrentUserProvider,
            conflictDetectionUseCase: ConflictDetectionUseCase
        ): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return EventViewModel(repository, currentUserProvider, conflictDetectionUseCase) as T
            }
        }
    }
}
