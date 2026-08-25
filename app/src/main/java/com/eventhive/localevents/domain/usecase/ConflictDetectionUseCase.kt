package com.eventhive.localevents.domain.usecase

import com.eventhive.localevents.domain.model.Event
import com.eventhive.localevents.domain.model.EventConflict
import com.eventhive.localevents.utils.Config
import com.eventhive.localevents.utils.TitleSimilarityCalculator
import kotlin.math.roundToInt

class ConflictDetectionUseCase {

    fun detectConflicts(newEvent: Event, existingEvents: List<Event>): List<EventConflict> {
        return existingEvents
            .filter { it.eventId != newEvent.eventId }
            .map { existing -> calculateConflict(newEvent, existing) }
            .filter { it.conflictScore >= Config.CONFLICT_THRESHOLD }
            .sortedByDescending { it.conflictScore }
    }

    private fun calculateConflict(newEvent: Event, existing: Event): EventConflict {
        val reasons = mutableListOf<String>()
        var score = 0

        // 1. Location (Max 30)
        var locationScore = 0
        if (newEvent.city.equals(existing.city, ignoreCase = true)) {
            locationScore += 15
            reasons.add("Same city")
            
            if (newEvent.neighborhood.equals(existing.neighborhood, ignoreCase = true)) {
                locationScore += 10
                reasons.add("Same neighborhood")
                
                if (newEvent.location.equals(existing.location, ignoreCase = true)) {
                    locationScore += 5
                    reasons.add("Same specific location")
                }
            }
        }
        score += locationScore

        // 2. Time Overlap (Max 30)
        val overlaps = newEvent.startTime < existing.endTime && newEvent.endTime > existing.startTime
        if (overlaps) {
            score += 30
            reasons.add("Time overlaps with existing event")
        }

        // 3. Category (Max 20)
        if (newEvent.category == existing.category) {
            score += 20
            reasons.add("Same event category")
        }

        // 4. Title Similarity (Max 20)
        val similarity = TitleSimilarityCalculator.calculate(newEvent.title, existing.title)
        val titleScore = (similarity * 20).roundToInt()
        if (titleScore > 5) {
            score += titleScore
            reasons.add("Event title appears similar")
        }

        return EventConflict(
            conflictingEventId = existing.eventId,
            conflictScore = score,
            reasons = reasons
        )
    }
}
