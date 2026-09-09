# EventHive Phase 6.1 — AI Event Description Assistant

## Objective

Phase 6.1 adds AI-assisted description generation to the existing EventHive event-creation workflow. A signed-in organizer enters an event title and the application automatically requests a description suggestion after a short debounce. The generated text is shown in the existing Description area, remains editable, and is never submitted automatically.

## Architecture

```text
Existing EventForm
      ↓
short title debounce
      ↓
POST /api/ai/event-description
      ↓
Authenticated EventHive backend
      ↓
eventDescriptionService
      ↓
Existing geminiService / Vertex AI Gemini
      ↓
500-character + meaningful-content validation
      ↓
JSON { description }
      ↓
aiDescription state
      ↓
Existing Description textarea / Insert control
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
  "description": "A2D Meetup brings local technology enthusiasts together in RS Puram, Coimbatore to connect, exchange ideas, and explore shared interests and collaboration."
}
```

## AI generation rules

The generation prompt treats all event fields as untrusted data rather than instructions. The model is instructed to:

- create a useful, informative, attendee-oriented description;
- use the supplied title and any supplied category, city, neighborhood, venue, or existing description where appropriate;
- avoid merely repeating the title;
- avoid generic filler and excessive promotional language;
- use only supplied facts;
- never invent dates, times, venues, addresses, speakers, organizers, prices, sponsors, links, attendee counts, awards, partnerships, achievements, statistics, or unsupported activities;
- prefer approximately 120–350 characters for limited input and approximately 200–450 characters when richer information is available;
- never exceed 500 characters;
- return only the description text.

If only a title is supplied, the description remains appropriately general and does not turn an ambiguous title into unsupported specifics.

## Meaningful-content validation

The backend rejects a generated result that is empty or too short to be useful. This prevents a minimal output such as `Join the A2D Meetup.` from being accepted merely because it satisfies the character limit.

A controlled second generation is used for responses that are too long or too short. The final response is validated again before it is returned.

The 500-character boundary remains authoritative.

## Frontend behavior

The existing Create Event layout is unchanged outside the Description field.

The Description area retains:

- the existing `Description *` label;
- the existing textarea dimensions and styling;
- the existing 500-character maximum;
- the existing character counter.

When a non-empty title is entered, generation starts automatically after a short debounce. There is no initial Generate button.

The compact controls below the textarea are:

`Insert` and `Regenerate`

During generation the controls remain within the Description area and show a subtle `Generating description...` state.

## Insert and regenerate behavior

The frontend keeps `aiDescription` separate from the user's intentional description state.

`Insert` explicitly accepts the current AI suggestion as the description.

`Regenerate` requests a new suggestion using the latest available event information. When the user has manually entered or edited a description, that text is supplied for an improvement request, but the returned suggestion is not silently written over the user's content.

If the user manually edits an AI-generated description, the edit becomes user-owned content and remains intact.

## Automatic-generation safeguards

The frontend uses a short debounce so typing does not make a request for every keystroke.

Each generation request is associated with the title that initiated it. A response is ignored when it belongs to an older request or when the current title no longer matches the title that triggered the request. This prevents stale AI results from overwriting newer title input.

Automatic generation does not submit the event, change other form fields, or advance the creation workflow.

## Failure behavior

AI generation is optional. A failed request leaves the EventHive form usable for manual description entry.

The frontend displays the generation error within the Description area and does not clear existing user content.

The backend returns controlled errors for invalid input, missing Gemini configuration, empty output, and unsuccessful length/quality validation.

## Existing EventHive behavior

No changes were made to event persistence, event update flow, conflict detection, RSVP, authentication, community requests, chatbot orchestration, semantic intelligence, or Firestore schema.

The description assistant is a separate authenticated read-only generation operation. It does not save or mutate an event by itself.

## Testing

`eventDescriptionService.test.js` uses a mocked Gemini client and does not require live Vertex AI credentials.

Coverage includes:

- valid meaningful generation;
- title forwarding;
- optional event context forwarding;
- empty and invalid title rejection;
- optional-field validation;
- empty model output;
- 500-character acceptance;
- controlled shortening/revision;
- rejection when the final result remains invalid;
- missing Gemini configuration;
- anti-instruction prompt constraints;
- meaningful attendee-oriented prompt requirements;
- protection against minimal generic output.

## Phase boundary

Phase 6.1 implements only AI-assisted event description generation.

Phase 6.2 Smart Venue Autocomplete is not implemented here. No Google Places autocomplete, Maps UI, geolocation, address extraction, or venue recommendation is included in this phase.
