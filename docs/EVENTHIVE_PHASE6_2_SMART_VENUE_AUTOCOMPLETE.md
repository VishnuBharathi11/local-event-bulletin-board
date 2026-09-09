# EventHive Phase 6.2 — Smart Venue Autocomplete

## Objective

Phase 6.2 adds a read-only smart venue search to the existing EventHive event-creation location step. The existing event form state, map picker, validation, and submission flow remain unchanged.

## Actual event-creation path

The feature is integrated into:

`frontend/src/components/events/Step03Location.jsx`

The parent `CreateEventPage.jsx` remains the owner of event form state and continues to submit the same existing event schema.

## Flow

```text
Venue input
  ↓
400 ms debounce
  ↓
GET /api/location/search?q=...
  ↓
Google Places Text Search (server-side)
  ↓
normalized suggestions
  ↓
user selection
  ↓
update location/city/neighborhood/latitude/longitude
```

Only the venue field is debounced. The complete event form is not debounced.

## Provider and credentials

The location provider is Google Places, reusing the project's existing Google geolocation infrastructure.

Preferred backend variable:

`GOOGLE_PLACES_API_KEY`

For existing local setups, the implementation also accepts:

`GOOGLE_GEOCODING_API_KEY`

as a fallback. Both values are server-only. They must never be exposed through React or Vite environment variables.

The Places API must be enabled for the server-side Google key.

## Endpoint

`GET /api/location/search?q=<venue query>`

The backend enforces a minimum query length of 2 characters and a maximum of 100 characters.

Successful response shape:

```json
{
  "suggestions": [
    {
      "venue": "Brookfield Mall",
      "address": "Avinashi Road, Coimbatore, Tamil Nadu, India",
      "city": "Coimbatore",
      "neighborhood": "Avinashi Road",
      "latitude": 11.0168,
      "longitude": 76.9558
    }
  ]
}
```

Provider-specific fields are not exposed to the frontend.

## Selection behavior

Selecting a result:

- places the venue name and formatted address into the existing `location` field
- fills `city` when Google supplies a city value
- fills `neighborhood` when Google supplies a neighborhood/sub-locality value
- fills latitude and longitude for the existing map picker
- closes the suggestion menu
- suppresses the immediate post-selection search

The project does not currently have a separate persisted `address` field in its event schema. Therefore the existing `location` field stores the selected venue plus formatted address when both are available. No new event schema field is introduced.

## UX behavior

Autocomplete supports:

- mouse selection
- Arrow Up / Arrow Down navigation
- Enter selection
- Escape to close
- outside-click closing
- loading state
- non-blocking provider errors
- continued manual venue entry when the provider is unavailable

Stale searches are ignored through a request-version reference. The latest query always wins.

## Security

The browser calls only the EventHive `/api/location/search` endpoint. Provider credentials remain on the backend. The backend constructs the Google request itself and does not proxy arbitrary browser-supplied URLs.

## Failure behavior

Location search is an enhancement and is not a prerequisite for event creation. Provider configuration failures, HTTP failures, malformed responses, and network failures return a controlled error while the existing venue/city/neighborhood inputs remain usable.

## Testing

`backend/src/services/locationSearchService.test.js` covers:

- valid search
- empty/short/oversized queries
- provider result normalization
- missing city
- missing neighborhood
- malformed results
- duplicate removal
- provider failures
- missing provider configuration
- zero-result responses

The frontend implementation uses the existing `apiRequest()` helper and does not introduce a new dependency or API client architecture.

## Phase boundary

Phase 6.2 does not modify:

- event creation submission architecture
- authentication
- RSVP behavior
- community requests
- chatbot behavior
- Phase 5 semantic services
- Firestore schema
- Firestore indexes
- deployment configuration
- existing Google Maps picker behavior
