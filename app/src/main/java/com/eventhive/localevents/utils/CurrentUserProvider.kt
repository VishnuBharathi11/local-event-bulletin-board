package com.eventhive.localevents.utils

import android.content.Context
import java.util.UUID

/**
 * Provides a stable development-safe user ID persisted in SharedPreferences.
 */
class CurrentUserProvider(context: Context) {
    private val prefs = context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
    
    fun getCurrentUserId(): String {
        // Return a fixed ID for development/demo to act as an organizer
        return "dev_user"
        
        /* 
        var userId = prefs.getString("user_id", null)
        if (userId == null) {
            userId = UUID.randomUUID().toString()
            prefs.edit().putString("user_id", userId).apply()
        }
        return userId
        */
    }
}
