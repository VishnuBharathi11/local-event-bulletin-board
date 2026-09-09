# EventHive Assistant — Phase 1 Foundation

## Purpose

Phase 1 establishes the backend contract and controlled read-only data boundary for the future EventHive conversational assistant. It does not call a generative model yet.

## Architecture

```text
React Chat UI (future phase)
        |
        v
POST /api/chatbot/chat
        |
        v
Chatbot service
        |
        +--> controlled EventHive tools
        |      +--> upcoming events
        |      +--> event details
        |      +--> community demand
        |
        v
Gemini / Vertex AI (future phase)
```

The browser never receives database credentials or direct Firestore access. Future model calls will remain behind the backend.

## Phase 1 endpoints

### GET /api/chatbot/capabilities

Returns the chatbot foundation version, supported intent groups, and the read-only tools that later model orchestration may call.

### POST /api/chatbot/chat

Request:

```json
{
  "message": "What events are coming up this weekend?"
}
```

Phase 1 validates the message and returns a controlled `not_ready` response. Gemini is intentionally not enabled until the explanation layer is implemented.

### GET /api/chatbot/tools/upcoming-events

Optional query parameters:

- `category`
- `city`
- `limit` (1–20)

This is a backend-only data contract for future tool calling.

### GET /api/chatbot/tools/events/:eventId

Returns one event or `404` when it does not exist.

### GET /api/chatbot/tools/community-demand

Optional `limit` query parameter (1–20). Returns active community requests and demand metrics.

## Guardrails established in Phase 1

- Read-only chatbot data access.
- Maximum chat message length of 1000 characters.
- Tool result limits of 20 records.
- No direct database access from the client.
- No generative model dependency yet.
- No event mutation tools.
- No RSVP, event creation, request creation, or profile mutation through the assistant.

## Planned evolution

Phase 2 will add deterministic trend metrics from event activity, RSVP velocity, category/location activity, and community demand.

Phase 3 will add Gemini-based explanations over verified application data.

Phase 4 will connect the React conversational UI to controlled backend tools.

Phase 5 will add Vertex AI embeddings and Firestore vector search for semantic similarity, conflict analysis, similar-event discovery, and trend clustering.
