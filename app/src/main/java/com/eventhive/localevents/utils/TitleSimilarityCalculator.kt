package com.eventhive.localevents.utils

import java.util.Locale

object TitleSimilarityCalculator {
    private val STOP_WORDS = setOf("a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by")

    /**
     * Calculates Jaccard similarity coefficient between two titles.
     * Returns a score between 0.0 and 1.0.
     */
    fun calculate(title1: String, title2: String): Float {
        val tokens1 = tokenize(title1)
        val tokens2 = tokenize(title2)

        if (tokens1.isEmpty() || tokens2.isEmpty()) return 0f

        val intersection = tokens1.intersect(tokens2).size
        val union = tokens1.union(tokens2).size

        return intersection.toFloat() / union.toFloat()
    }

    private fun tokenize(text: String): Set<String> {
        return text.lowercase(Locale.getDefault())
            .replace(Regex("[^a-z0-9\\s]"), "")
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() && it !in STOP_WORDS }
            .toSet()
    }
}
