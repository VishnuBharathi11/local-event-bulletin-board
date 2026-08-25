package com.eventhive.localevents.utils

import com.eventhive.localevents.domain.model.Event
import com.eventhive.localevents.domain.model.EventRequest
import com.eventhive.localevents.domain.model.EventRequestStatus
import com.eventhive.localevents.domain.model.EventStatus

object SampleData {
    val events = listOf(
        Event(
            eventId = "1",
            title = "Tech Meetup 2026",
            description = "A gathering for developers to discuss the latest in Android.",
            category = "Meetup",
            city = "Bangalore",
            neighborhood = "Indiranagar",
            location = "Coworking Space A",
            startTime = System.currentTimeMillis() + 86400000,
            endTime = System.currentTimeMillis() + 86400000 + 7200000,
            status = EventStatus.PUBLISHED
        ),
        Event(
            eventId = "2",
            title = "Jazz Under the Stars",
            description = "Enjoy a night of live jazz music in the city park.",
            category = "Music",
            city = "Bangalore",
            neighborhood = "Cubbon Park",
            location = "Bandstand",
            startTime = System.currentTimeMillis() + 172800000,
            endTime = System.currentTimeMillis() + 172800000 + 10800000,
            status = EventStatus.PUBLISHED
        ),
        Event(
            eventId = "3",
            title = "Pottery Workshop",
            description = "Learn the basics of pottery and create your own ceramic bowl.",
            category = "Workshop",
            city = "Bangalore",
            neighborhood = "Jayanagar",
            location = "Art Studio B",
            startTime = System.currentTimeMillis() + 259200000,
            endTime = System.currentTimeMillis() + 259200000 + 14400000,
            status = EventStatus.PUBLISHED
        ),
        Event(
            eventId = "4",
            title = "Community Cleanup",
            description = "Join your neighbors to help clean up the local neighborhood.",
            category = "Community",
            city = "Bangalore",
            neighborhood = "Koramangala",
            location = "Community Center",
            startTime = System.currentTimeMillis() + 345600000,
            endTime = System.currentTimeMillis() + 345600000 + 18000000,
            status = EventStatus.PUBLISHED
        ),
        Event(
            eventId = "5",
            title = "Weekend Football Match",
            description = "Friendly community football match. All skill levels welcome.",
            category = "Sports",
            city = "Bangalore",
            neighborhood = "HSR Layout",
            location = "Sports Ground C",
            startTime = System.currentTimeMillis() + 432000000,
            endTime = System.currentTimeMillis() + 432000000 + 7200000,
            status = EventStatus.PUBLISHED
        )
    )

    val requests = listOf(
        EventRequest(
            requestId = "r1",
            title = "Weekend Badminton Meetup",
            description = "Let's get together for some friendly badminton matches.",
            category = "Sports",
            city = "Coimbatore",
            neighborhood = "RS Puram",
            location = "Community Sports Ground",
            startTime = System.currentTimeMillis() + 604800000,
            endTime = System.currentTimeMillis() + 604800000 + 7200000,
            demandCount = 18,
            demandThreshold = 20,
            status = EventRequestStatus.COLLECTING_DEMAND
        ),
        EventRequest(
            requestId = "r2",
            title = "Community Football Practice",
            description = "Weekly practice session for the local football team.",
            category = "Sports",
            city = "Coimbatore",
            neighborhood = "Peelamedu",
            location = "School Ground",
            startTime = System.currentTimeMillis() + 691200000,
            endTime = System.currentTimeMillis() + 691200000 + 7200000,
            demandCount = 20,
            demandThreshold = 20,
            status = EventRequestStatus.THRESHOLD_REACHED,
            organizerId = "dev_user" // To test organizer controls
        ),
        EventRequest(
            requestId = "r3",
            title = "Photography Workshop",
            description = "Learn how to capture stunning street photos.",
            category = "Workshops",
            city = "Coimbatore",
            neighborhood = "Gandhipuram",
            location = "Art Cafe",
            startTime = System.currentTimeMillis() + 777600000,
            endTime = System.currentTimeMillis() + 777600000 + 10800000,
            demandCount = 7,
            demandThreshold = 20,
            status = EventRequestStatus.COLLECTING_DEMAND
        )
    )
}
