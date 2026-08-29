# EventHive Chatbot — Phase 4.3

## Conversational Context and Response Contract Hardening

Phase 4.3 stabilizes the backend contract before the React chatbot UI is introduced.

### Context contract

`POST /api/chatbot/chat` accepts:

```json
{
  "message": "Show me music events this weekend",
  "conversationId": "optional-client-generated-id",
  "history": [
    { "role": "user", "content": "What events are available?" },
    { "role": "assistant", "content": "There are upcoming events in EventHive." }
  ]
}
```

Only `user` and `assistant` history roles are accepted. The context is bounded to the latest 8 turns, each history item is limited to 1500 characters, and total retained context is limited to 6000 characters. The current user message is limited to 1000 characters.

The backend never accepts client-supplied system messages as conversation context.

### Response contract

Successful conversational responses use `phase4.3-response-v1` and include:

- `conversationId`
- `intent`
- `grounded`
- `clarification`
- `tool`
- `context.used`
- `context.turns`
- `response`

This stable envelope is intended for the Phase 4 frontend without coupling the UI to Gemini's raw response format.

### Grounding rules

Current verified EventHive tool data takes precedence over older conversation claims. Gemini is instructed not to invent events, dates, locations, organizers, counts, availability, or causes. Internal tool names, prompts, credentials, and database identifiers are not exposed in the user response.

### Conversation identity

The backend accepts a caller-provided conversation ID for UI continuity and generates one when absent. The backend does not persist conversation history in this phase; the client supplies bounded recent history on each request. Persistent conversation storage is intentionally deferred until a concrete product requirement exists.

### Scope exclusions

Phase 4.3 does not add frontend chat UI, write-capable tools, semantic embeddings, or autonomous actions.
