# EventHive Phase 6.1 — AI Event Description Assistant

## Objective

Phase 6.1 adds an AI-assisted description generator to the existing EventHive event-creation workflow. A signed-in organizer can provide an event title and optionally the already-known category, city, neighborhood, venue, and existing description. The backend generates one concise description that remains editable and never submits the event automatically.

## Architecture

```text
React Event Form
      ↓
POST /api/ai/event-description
      ↓
Authenticated EventHive backend
      ↓
eventDescriptionService
      ↓
Existing geminiService / Vertex AI Gemini
      ↓
500-character validation
      ↓
JSON { description }
      ↓
React description field
```

Google AI credentials and configuration remain server-side. The browser never receives service-account credentials, ADC data, API keys, or raw Gemini responses.

## Endpoint

`POST /api/ai/event-description`

The endpoint requires the existing EventHive session authentication.

Example request:

```json
{
  "title": "A2D Meetup!",
  "category": "Meetups",
  "city": "Coimbatore",
  "neighborhood": "RS Puram",
  "location": "Community Hall"
}
```

The response contract is:

```json
{
  "description": "Join the A2D Meetup to connect with fellow technology enthusiasts and exchange ideas with the local community."
}
```

## AI generation rules

The generation prompt treats event fields as untrusted data. Event text cannot override the generation constraints.

The model is instructed to:

- use only supplied event information;
- avoid inventing dates, times, venues, speakers, organizers, prices, sponsors, links, statistics, partnerships, or unsupported activities;
- keep the result at or below 500 characters;
- avoid unnecessary repetition and excessive marketing language;
- return only the description text.

When an existing description is supplied, the task becomes an improvement of that text while preserving its supported facts.

## 500-character handling

The backend always validates the final description against the existing 500-character EventHive limit.

If the first Gemini response exceeds 500 characters, a second controlled shortening request is made. If the shortened result still violates the limit, the request fails instead of silently truncating or persisting an invalid description.

## Frontend behavior

The existing `EventForm` gains a description-assistance action below the description field.

When the field is empty:

`Generate with AI`

When the field already contains text:

`Regenerate with AI`

with supporting UI indicating that the existing description will be improved.

During generation the action is disabled and displays:

`Generating description...`

Successful generation populates the description field but does not submit the event. The description remains fully editable and the existing 500-character counter remains visible.

## Failure behavior

AI generation is optional. A failure leaves the event form usable for manual description entry.

The backend maps configuration, empty-response, and length-validation failures to concise API errors. Credentials and tokens are never returned to the browser.

## Existing EventHive behavior

No changes were made to event creation persistence, update flow, conflict detection, RSVP, authentication behavior, community requests, chatbot orchestration, semantic intelligence, or Firestore schema.

The description assistant is a separate authenticated read-only AI generation operation. It does not save or mutate an event.

## Testing

`eventDescriptionService.test.js` uses a mocked Gemini client. It does not require live Vertex AI credentials.

Coverage includes:

- valid generation;
- title forwarding;
- optional event context forwarding;
- empty and invalid title rejection;
- optional-field validation;
- empty model output;
- 500-character acceptance;
- controlled shortening of overlong output;
- rejection when shortening still exceeds the limit;
- missing Gemini configuration;
- anti-instruction prompt constraints.

## Phase boundary

Phase 6.1 implements only AI-assisted event description generation.

Phase 6.2 Smart Venue Autocomplete is not implemented here. No Places autocomplete, Google Maps UI, geolocation, address extraction, or venue recommendation is included in this phase.
