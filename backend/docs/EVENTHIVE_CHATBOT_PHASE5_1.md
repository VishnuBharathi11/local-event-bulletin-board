# EventHive Chatbot Phase 5.1 — Vertex AI Embedding Infrastructure

## Objective

Phase 5.1 establishes the server-side semantic embedding infrastructure required by later EventHive semantic capabilities.

The pipeline is:

```text
EventHive Event
    -> deterministic canonical event text
    -> Vertex AI gemini-embedding-001
    -> 768-dimensional embedding
    -> Firestore vector value
    -> supplementary embedding metadata on the existing event document
    -> Firestore vector index
    -> future Phase 5 semantic capabilities
```

Phase 5.1 creates semantic infrastructure. It does not yet make conflict detection semantic.

## Architectural boundary

The existing deterministic EventHive intelligence remains unchanged. Phase 2 trend calculations continue to operate independently of embeddings, and Phase 4 conversational routing does not use embeddings in this phase.

Phase 5.1 does not add semantic similarity, conflict detection, similar-event discovery, trend clustering, semantic chatbot search, AI conflict explanations, embeddings-based routing, persistent chat storage, new chatbot tools, or write-capable chatbot tools.

## Canonical event representation

The canonicalizer is implemented in `backend/src/services/eventCanonicalization.js`.

Only these existing event fields are included, in a fixed order with explicit labels:

```text
Title: <title>
Description: <description>
Category: <category>
City: <city>
Neighborhood: <neighborhood>
Location: <location>
```

The canonicalizer intentionally excludes event IDs, organizer IDs, image URLs, signed image URLs, RSVP counts, timestamps, status, and other internal or volatile metadata.

The canonical representation is deterministic: the same semantic event fields produce the same text regardless of RSVP count, timestamps, or unrelated event metadata.

## Embedding configuration

The explicit Phase 5.1 defaults are:

```text
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_TASK_TYPE=RETRIEVAL_DOCUMENT
EMBEDDING_DIMENSIONS=768
EMBEDDING_CONFIG_VERSION=phase5.1-v1
```

`768` is intentionally below Firestore's maximum supported vector dimension of `2048` and is explicitly passed to the embedding request.

The configuration is centralized in `backend/src/services/eventEmbeddingConfig.js`. Future re-embedding operations can use the stored configuration version to identify which configuration produced a vector.

## Vertex AI embedding service

`backend/src/services/eventEmbeddingService.js` owns Vertex AI interaction.

The service:

1. Validates the embedding configuration.
2. Requires non-empty canonical event text.
3. Uses the existing `@google/genai` SDK with Vertex AI mode.
4. Uses `gemini-embedding-001` by default.
5. Requests `RETRIEVAL_DOCUMENT`.
6. Requests the configured output dimensionality of `768`.
7. Validates that an embedding is returned.
8. Validates every vector element as numeric and finite.
9. Validates the exact configured vector length.
10. Returns the vector and explicit embedding metadata.

There is no random, zero-vector, or other fake fallback.

The Vertex AI client is created only on the server. Google Cloud authentication is therefore not exposed to the browser.

## Authentication requirements

The embedding service requires:

```text
GOOGLE_CLOUD_PROJECT=<server-side Google Cloud project ID>
GOOGLE_CLOUD_LOCATION=global
```

Google Application Default Credentials must be available to the server process. The existing Firebase Admin configuration remains the Firestore authentication mechanism.

For local development, authenticate with Google Application Default Credentials before running an embedding operation. In deployed environments, use the service's supported workload identity/service-account authentication mechanism.

Do not send Firebase private keys, JWT secrets, cookies, authentication tokens, organizer credentials, or other application credentials to Vertex AI. The embedding request contains only the canonical event text and embedding configuration.

## Firestore storage structure

The existing `events` collection is retained. No replacement event schema is introduced.

Embedding metadata is written with a Firestore merge operation so that only the following supplementary fields are added or updated:

```text
embedding
embeddingModel
embeddingDimensions
embeddingTaskType
embeddingConfigVersion
embeddingUpdatedAt
```

The `embedding` field uses the Firestore vector representation provided by `FieldValue.vector(...)`, rather than an ordinary JSON array. This is the representation required for future Firestore vector search.

The existing event fields remain owned by the existing EventHive event model. The embedding repository does not rewrite title, description, category, city, neighborhood, location, dates, status, RSVP count, organizer information, or other event data.

## Embedding generation pathway

`backend/src/services/eventEmbeddingPipeline.js` provides an isolated pathway for future callers:

```text
Event object
    -> canonicalizeEvent(event)
    -> generateEventEmbedding(canonicalText)
    -> saveEventEmbedding(eventId, embeddingResult)
```

This pathway is intentionally not wired into ordinary event creation in Phase 5.1. This preserves backward compatibility: failure of Vertex AI or embedding authentication cannot make normal EventHive event creation fail.

## Vector validation

`backend/src/services/embeddingValidator.js` is pure validation logic.

It rejects:

- missing or empty vectors
- non-array vectors
- incorrect vector length
- non-numeric values
- `NaN`
- positive or negative infinity

Malformed vectors cannot reach the Firestore persistence layer.

## Vector index requirement

The repository already uses `firestore.indexes.json` through `firebase.json`. Phase 5.1 adds only the required `events.embedding` vector index and leaves unrelated indexes unchanged.

The index definition is:

```json
{
  "collectionGroup": "events",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "embedding",
      "vectorConfig": {
        "dimension": 768,
        "flat": {}
      }
    }
  ]
}
```

Deploy the repository's Firestore index configuration with:

```powershell
firebase deploy --only firestore:indexes
```

The project must be authenticated with an account that has permission to create Firestore indexes. Index creation is asynchronous. The application must not assume that the vector index is immediately ready after deployment.

Alternatively, the vector index can be created through the Firebase/Google Cloud Firestore indexing interface using collection `events`, vector field `embedding`, dimension `768`, and a flat vector index.

No KNN query is implemented in Phase 5.1.

## Backward compatibility

Existing EventHive operations do not depend on the embedding service in this phase.

The following remain independent of embedding availability:

- event creation
- event discovery
- RSVP functionality
- authentication
- existing chatbot operation
- deterministic trend analysis
- existing frontend integration

Embedding generation is deliberately exposed as a dedicated server-side pathway rather than being inserted into the existing event-write path.

## Testing

Focused tests are in:

```text
backend/src/services/eventEmbeddingInfrastructure.test.js
```

The tests cover deterministic canonicalization, semantic field inclusion, volatile/internal field exclusion, explicit configuration, dimensionality validation, empty embeddings, invalid vector values, vector length validation, valid vectors, mocked Vertex AI requests, mocked Vertex AI failure cases, Firestore merge persistence, embedding metadata, and preservation of the existing event contract.

The Vertex AI API is mocked. The test suite does not require live Google Cloud credentials.

Run the backend test suite from `backend`:

```powershell
npm test
```

The repository's existing tests should be run together with the new focused tests. No existing tests were intentionally changed by Phase 5.1.

## Phase 5.1 does NOT implement

Phase 5.1 does not implement:

- semantic conflict detection
- similar-event discovery
- semantic similarity thresholds
- trend clustering
- semantic chatbot search
- AI conflict explanations
- embeddings-based intent routing
- persistent chat storage
- new chatbot tools
- write-capable chatbot tools
- frontend UI changes
- replacement of deterministic trend intelligence

## Phase 5.2+ consumption

Future phases can consume the stored `embedding` field through Firestore KNN vector queries. A future query embedding can use an appropriate query-oriented embedding task and the same configured dimensionality, then compare it against the indexed event vectors.

Future semantic conflict detection can combine semantic similarity with the existing deterministic event fields such as time, location, category, and other business rules. The embedding layer should not replace deterministic EventHive intelligence.

The configuration metadata stored beside each vector allows later phases to verify model, task type, dimensionality, and configuration-version compatibility before using vectors together.

## Security boundary

All embedding generation remains server-side.

The browser never receives Google Cloud credentials for this service. The Vertex AI request is limited to the deterministic canonical event representation. Authentication secrets and unrelated application data are not included in the embedding request.
