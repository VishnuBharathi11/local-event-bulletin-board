# EventHive Chatbot Phase 5.2 — Semantic Similarity Infrastructure

## Objective

Phase 5.2 adds the semantic similarity query layer on top of the Phase 5.1 Vertex AI embedding and Firestore vector infrastructure.

```text
Event / canonical text
        ↓
Vertex AI query embedding
        ↓
Firestore KNN vector query
        ↓
nearest EventHive events
```

This phase provides reusable semantic similarity infrastructure only. It does not yet implement conflict detection, semantic chatbot routing, trend clustering, or AI-generated conflict explanations.

## Existing Phase 5.1 foundation

Phase 5.1 stores event embeddings in the existing `events` collection using the Firestore vector representation. Stored event/document embeddings remain:

```text
model:       gemini-embedding-001
task type:   RETRIEVAL_DOCUMENT
dimensions:  768
config:      phase5.1-v1
```

Phase 5.2 query embeddings use:

```text
model:       gemini-embedding-001
task type:   RETRIEVAL_QUERY
dimensions:  768
config:      phase5.1-v1
```

The model and dimensionality remain compatible with the indexed event vectors while using the query-oriented task type for semantic retrieval.

## Semantic similarity service

`backend/src/services/semanticSimilarityService.js` provides two server-side operations:

- `findSimilarEventsByVector(queryVector, options, firestore)` — executes a Firestore KNN query against `events.embedding`.
- `findSimilarEvents(canonicalText, options, firestore, embeddingGenerator)` — generates a `RETRIEVAL_QUERY` embedding and then performs the vector query.

The service uses Firestore's `findNearest` operation and the existing `embedding` field.

Default query behavior:

```text
limit: 10
maximum limit: 20
distance measure: COSINE
distance result field: _vectorDistance
```

The service supports Firestore's `COSINE`, `EUCLIDEAN`, and `DOT_PRODUCT` distance measures. EventHive's default is `COSINE`.

## Query result

A result contains the existing event document data plus:

```text
eventId
...
distance
```

The similarity layer does not mutate event documents and does not create another event collection.

## Architectural boundary

Phase 5.2 does not change the deterministic EventHive intelligence.

It does not replace:

- deterministic conflict detection
- deterministic trend analysis
- existing chatbot intent classification
- existing event discovery
- RSVP logic
- event-request logic

Instead, it establishes a reusable semantic signal that later phases can combine with those deterministic rules.

For example, a future conflict detector can use:

```text
semantic similarity
       +
time overlap
       +
location relationship
       +
existing activity/domain rules
```

The semantic score must not by itself decide that two events are a conflict.

## No new application endpoint

Phase 5.2 intentionally does not expose a public chatbot endpoint or frontend feature. The service is an internal backend capability for later phases.

This prevents semantic search from bypassing the Phase 4 deterministic conversational contract before the semantic layer has been evaluated.

## Security

Embedding generation and vector search remain server-side. No Google Cloud credentials, Firebase credentials, cookies, JWTs, organizer credentials, or browser authentication material is sent to Vertex AI.

Only the intended semantic query text is embedded.

## Testing

`backend/src/services/semanticSimilarityService.test.js` contains focused tests for:

- bounded result limits
- supported distance measures
- explicit query embedding configuration
- use of the existing `events.embedding` field
- Firestore vector query construction
- configured 768-dimensional query vectors
- `RETRIEVAL_QUERY` task type
- query embedding before KNN search
- returned event identity and vector distance
- absence of event-document writes

Vertex AI generation is mocked. Firestore query behavior is mocked. No live Google Cloud or Firestore credentials are required for the unit tests.

## Phase 5.2 does NOT implement

- semantic conflict detection
- conflict thresholds
- automatic conflict decisions
- similar-event UI
- semantic chatbot search
- trend clustering
- AI conflict explanations
- embeddings-based intent routing
- persistent conversation storage
- new chatbot tools
- autonomous actions
- frontend changes

## Next phase

A later phase can combine the semantic similarity signal with EventHive's existing deterministic conflict rules. The semantic result should be treated as supporting evidence, not as an unconditional conflict decision.
