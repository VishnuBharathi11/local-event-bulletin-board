package com.eventhive.localevents

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.eventhive.localevents.presentation.navigation.MainNavigation
import com.eventhive.localevents.presentation.theme.EventHiveTheme
import com.eventhive.localevents.utils.Injection

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    Injection.initialize(applicationContext)

    val deepLinkEventId = intent?.data?.let { uri ->
        if (uri.scheme == "eventhive" && uri.host == "event") {
            uri.pathSegments.firstOrNull()
        } else null
    }

    enableEdgeToEdge()
    setContent {
      EventHiveTheme {
          Surface(
              modifier = Modifier.fillMaxSize(),
              color = MaterialTheme.colorScheme.background
          ) {
              MainNavigation(deepLinkEventId = deepLinkEventId)
          }
      }
    }
  }
}
