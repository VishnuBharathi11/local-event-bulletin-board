package com.eventhive.localevents.utils

import android.content.Context
import android.util.Log
import com.eventhive.localevents.data.datasource.EventDataSource
import com.eventhive.localevents.data.datasource.FirestoreEventDataSource
import com.eventhive.localevents.data.datasource.InMemoryEventDataSource
import com.eventhive.localevents.data.repository.EventRepositoryImpl
import com.eventhive.localevents.domain.repository.EventRepository
import com.eventhive.localevents.domain.usecase.ConflictDetectionUseCase
import com.google.firebase.firestore.FirebaseFirestore

/**
 * Simple dependency injection container for the initial implementation phase.
 */
object Injection {
    private var currentUserProvider: CurrentUserProvider? = null

    fun initialize(context: Context) {
        if (currentUserProvider == null) {
            currentUserProvider = CurrentUserProvider(context)
        }
    }

    fun provideCurrentUserProvider(): CurrentUserProvider {
        return currentUserProvider ?: throw IllegalStateException("Injection not initialized with context")
    }

    private fun provideDataSource(): EventDataSource {
        return try {
            // Attempt to initialize Firestore. 
            // This will fail if google-services.json is missing or the plugin is not applied.
            val firestore = FirebaseFirestore.getInstance()
            Log.d("Injection", "Using Firestore Data Source")
            FirestoreEventDataSource(firestore)
        } catch (e: Exception) {
            Log.e("Injection", "Firebase not initialized, falling back to In-Memory Data Source", e)
            InMemoryEventDataSource()
        }
    }

    fun provideRepository(): EventRepository =
        EventRepositoryImpl(provideDataSource())

    fun provideConflictDetectionUseCase(): ConflictDetectionUseCase =
        ConflictDetectionUseCase()
}
