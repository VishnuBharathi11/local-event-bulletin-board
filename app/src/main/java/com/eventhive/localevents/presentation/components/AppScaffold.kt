package com.eventhive.localevents.presentation.components

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.eventhive.localevents.presentation.navigation.Screen

@Composable
fun AppScaffold(
    currentScreen: Screen,
    onNavigate: (Screen) -> Unit,
    content: @Composable (Modifier) -> Unit
) {
    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentScreen is Screen.EventBoard,
                    onClick = { onNavigate(Screen.EventBoard) },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Board") },
                    label = { Text("Board") }
                )
                NavigationBarItem(
                    selected = currentScreen is Screen.CreateEvent,
                    onClick = { onNavigate(Screen.CreateEvent) },
                    icon = { Icon(Icons.Default.Add, contentDescription = "Create") },
                    label = { Text("Create") }
                )
                NavigationBarItem(
                    selected = currentScreen is Screen.Calendar,
                    onClick = { onNavigate(Screen.Calendar) },
                    icon = { Icon(Icons.Default.DateRange, contentDescription = "Calendar") },
                    label = { Text("Calendar") }
                )
            }
        }
    ) { innerPadding ->
        content(Modifier.padding(innerPadding))
    }
}
