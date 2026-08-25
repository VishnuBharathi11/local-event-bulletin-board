package com.eventhive.localevents.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavEntry
import androidx.navigation3.ui.NavDisplay
import com.eventhive.localevents.presentation.components.AppScaffold
import com.eventhive.localevents.presentation.screens.CalendarScreen
import com.eventhive.localevents.presentation.screens.CommunityRequestsScreen
import com.eventhive.localevents.presentation.screens.CreateEventScreen
import com.eventhive.localevents.presentation.screens.EventBoardScreen
import com.eventhive.localevents.presentation.screens.EventDetailsScreen
import com.eventhive.localevents.presentation.screens.RequestDetailsScreen
import com.eventhive.localevents.presentation.screens.RequestEventScreen
import com.eventhive.localevents.presentation.viewmodel.EventViewModel
import com.eventhive.localevents.utils.Injection

@Composable
fun MainNavigation(deepLinkEventId: String? = null) {
    val backStack = remember { 
        mutableStateListOf<Any>().apply {
            add(Screen.EventBoard)
            if (deepLinkEventId != null) {
                add(Screen.EventDetails(deepLinkEventId))
            }
        }
    }
    val currentScreen = backStack.last() as? Screen ?: Screen.EventBoard

    // Initialize ViewModel with the repository provided by Injection utility
    val viewModel: EventViewModel = viewModel(
        factory = EventViewModel.provideFactory(
            Injection.provideRepository(),
            Injection.provideCurrentUserProvider(),
            Injection.provideConflictDetectionUseCase()
        )
    )

    AppScaffold(
        currentScreen = currentScreen,
        onNavigate = { screen ->
            // Simple navigation logic: if it's a top level screen, replace the stack
            if (screen is Screen.EventBoard || screen is Screen.CreateEvent || screen is Screen.Calendar || screen is Screen.CommunityRequests) {
                backStack.clear()
                backStack.add(screen)
            } else {
                backStack.add(screen)
            }
        }
    ) { modifier ->
        NavDisplay(
            modifier = modifier,
            backStack = backStack,
            onBack = { if (backStack.size > 1) backStack.removeLast() },
            entryProvider = { key ->
                when (key) {
                    is Screen.EventBoard -> NavEntry(key) {
                        EventBoardScreen(
                            viewModel = viewModel,
                            onNavigateToCreate = { backStack.add(Screen.CreateEvent) },
                            onNavigateToDetails = { id -> backStack.add(Screen.EventDetails(id)) },
                            onNavigateToRequests = { backStack.add(Screen.CommunityRequests) }
                        )
                    }
                    is Screen.CreateEvent -> NavEntry(key) {
                        CreateEventScreen(
                            viewModel = viewModel,
                            onNavigateBack = { backStack.removeLast() },
                            onNavigateToDetails = { id -> backStack.add(Screen.EventDetails(id)) }
                        )
                    }
                    is Screen.EventDetails -> NavEntry(key) {
                        EventDetailsScreen(
                            eventId = key.eventId,
                            viewModel = viewModel,
                            onNavigateBack = { backStack.removeLast() }
                        )
                    }
                    is Screen.Calendar -> NavEntry(key) {
                        CalendarScreen(
                            viewModel = viewModel,
                            onNavigateToDetails = { id -> backStack.add(Screen.EventDetails(id)) }
                        )
                    }
                    is Screen.CommunityRequests -> NavEntry(key) {
                        CommunityRequestsScreen(
                            viewModel = viewModel,
                            onNavigateToRequestForm = { backStack.add(Screen.RequestEvent) },
                            onNavigateToDetails = { id -> backStack.add(Screen.RequestDetails(id)) },
                            onNavigateBack = { backStack.clear(); backStack.add(Screen.EventBoard) }
                        )
                    }
                    is Screen.RequestEvent -> NavEntry(key) {
                        RequestEventScreen(
                            viewModel = viewModel,
                            onNavigateBack = { backStack.removeLast() }
                        )
                    }
                    is Screen.RequestDetails -> NavEntry(key) {
                        RequestDetailsScreen(
                            requestId = key.requestId,
                            viewModel = viewModel,
                            onNavigateBack = { backStack.removeLast() },
                            onNavigateToDetails = { id -> backStack.add(Screen.EventDetails(id)) }
                        )
                    }
                    else -> error("Unknown route: $key")
                }
            }
        )
    }
}
