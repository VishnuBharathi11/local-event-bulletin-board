# EventHive Chatbot — Phase 3: Gemini Explanation Layer

## Objective

Phase 3 adds Gemini as a grounded explanation layer on top of the Phase 2 deterministic trend engine.

The architecture is intentionally one-directional:

```text
Firestore EventHive data
        ↓
Phase 2 deterministic trend engine
        ↓
structured evidence
        ↓
Gemini explanation layer
        ↓
natural-language explanation
```

Gemini does not calculate the trend metrics, query Firestore directly, or modify EventHive data.

## Technology

The backend uses Google's current `@google/genai` JavaScript SDK with Vertex AI. Google documents the SDK for Node.js and Vertex AI authentication through Google Cloud project configuration and Application Default Credentials (ADC). The implementation defaults to `gemini-2.5-flash`, which can be overridden through `GEMINI_MODEL`.

## Configuration

Required:

```text
GOOGLE_CLOUD_PROJECT=<your Google Cloud project ID>
```

Optional:

```text
GOOGLE_CLOUD_LOCATION=global
GEMINI_MODEL=gemini-2.5-flash
```

Local development can use Application Default Credentials:

```text
gcloud auth application-default login
```

The Vertex AI API must be enabled and the authenticated identity must have permission to use the model.

Do not put credentials, service-account JSON, or API keys in the repository or React frontend.

## Endpoint

```text
POST /api/chatbot/trends/explain
```

Example request:

```json
{
  "question": "What events are trending this month?",
  "days": 30,
  "city": "Coimbatore"
}
```

The backend first calls the deterministic trend engine. Only the resulting structured evidence is supplied to Gemini.

Example response shape:

```json
{
  "mode": "grounded-trend-explanation",
  "evidenceVersion": "phase2-deterministic-trends-v1",
  "evidence": {},
  "model": "gemini-2.5-flash",
  "response": "..."
}
```

## Grounding rules

The Gemini prompt explicitly requires:

- Use only supplied EventHive evidence.
- Do not invent event names, numbers, locations, categories, causes, or user behavior.
- Distinguish measured facts from interpretation.
- State when evidence is insufficient.
- Treat Phase 2 as the source of quantitative truth.
- Do not expose internal implementation details or identifiers.

The temperature is intentionally low (`0.2`) because this is an analytical explanation layer, not creative generation.

## Phase boundary

The existing `POST /api/chatbot/chat` endpoint remains a Phase 2 foundation endpoint and is not converted into the complete conversational assistant yet.

Phase 4 will add intent handling and the React chatbot experience. It will use the Phase 2 tools and Phase 3 Gemini explanation capability rather than bypassing them.

Phase 5 will add Vertex AI embeddings and semantic similarity for similar-event discovery, trend clustering, and stronger conflict detection.
