# EventHive Chatbot — Phase 4.1

## Conversational backend orchestration and intent/tool routing

Phase 4.1 converts the Phase 3 grounded Gemini explanation capability into a controlled conversational backend. The `/api/chatbot/chat` endpoint now classifies the user's request, selects one read-only EventHive tool, retrieves verified application data, and asks Gemini to formulate a grounded response.

### Supported intents

- `event_discovery`
- `event_details` (reserved for the next routing refinement)
- `community_demand`
- `trend_analysis`
- `unsupported`

### Current tool mapping

| Intent | Tool |
|---|---|
| `event_discovery` | `getUpcomingEvents` |
| `community_demand` | `getCommunityDemand` |
| `trend_analysis` | `getTrendAnalysis` |

No write operation is exposed through the conversational endpoint.

### Request

`POST /api/chatbot/chat`

```json
{
  "message": "What events are trending in Coimbatore?",
  "history": [
    { "role": "user", "content": "What is popular this week?" },
    { "role": "assistant", "content": "Music currently has the strongest RSVP activity." }
  ]
}
```

### Response

```json
{
  "mode": "conversational-assistant",
  "intent": "trend_analysis",
  "grounded": true,
  "tool": "getTrendAnalysis",
  "response": "..."
}
```

### Grounding boundary

The deterministic EventHive services remain the source of truth. Gemini receives only the result of the selected read-only tool plus the user's question and limited conversation history. Gemini must not invent EventHive facts, expose database identifiers, or modify application data.

### Conversation history

The client may send recent user/assistant turns. The backend accepts at most eight normalized messages and truncates each message to a safe size. System-role messages supplied by the client are ignored.

### Scope intentionally deferred

Phase 4.1 does not implement the React chat interface, persistent server-side conversation storage, semantic vector search, or write-capable actions. Those belong to later phases.
