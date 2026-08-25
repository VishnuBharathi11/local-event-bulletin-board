package com.eventhive.localevents.domain.model

import org.junit.Assert.assertEquals
import org.junit.Test

class EventTest {
    @Test
    fun event_defaultValues() {
        val event = Event(title = "Hackathon")
        assertEquals("Hackathon", event.title)
        assertEquals(EventStatus.DRAFT, event.status)
    }
}
