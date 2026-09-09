# EventHive Phase 5.4 — Semantic Event Discovery & Intelligence Integration

## Objective

Phase 5.4 integrates the validated Phase 5 semantic infrastructure into domain-level EventHive discovery operations.

The flow is:

```text
User/event query
      ↓
Semantic query representation
      ↓
Vertex AI RETRIEVAL_QUERY embedding
      ↓
Firestore KNN search on events.embedding
      ↓
Semantic candidates
      ↓
Deterministic EventHive filters
      ↓
Normalized domain results
```

The existing Phase 5.3 semantic conflict intelligence remains available as a separate capability. Phase 5.4 does not replace the deterministic conflict rules.

## Capabilities

Two domain operations are exposed:

```text
POST /api/chatbot/semantic-search
GET  /api/chatbot/events/:eventId/similar
```

These are backend domain endpoints, not raw vector-query endpoints.

### Semantic event search

Request:

```json
{
  "query": "concert or music performance",
  "limit": 5,
  "category": "Music",
  "city": "Coimbatore"
}
```

The query is embedded using the existing Phase 5.2 query embedding configuration and sent to Firestore KNN against `events.embedding`.

Category and city are then applied as deterministic filters to the returned candidates.

### Similar event discovery

The source event is loaded through the existing EventHive event-detail service. Its canonical semantic fields are embedded, and KNN returns related events.

The source event itself is removed from the final result.

## Result contract

A normalized result can contain:

```json
{
  "eventId": "...",
  "title": "Hip Hop Aadhi Concert",
  "category": "Music",
  "city": "Coimbatore",
  "distance": 0.08,
  "semanticSimilarity": 0.92
}
```

Firestore-specific vector metadata is removed from the domain result.

For cosine distance, semantic similarity is represented as `1 - distance`, bounded to `[0, 1]`. This is a presentation-level normalization; the Firestore KNN distance remains the source retrieval signal.

## Semantic query construction

Free-text queries are preserved exactly after trimming.

Structured queries can use only the same existing EventHive semantic fields established in Phase 5.1:

```text
Title
Description
Category
City
Neighborhood
Location
```

No IDs, authentication information, RSVP counts, signed image URLs, or other internal metadata are sent for semantic embedding.

## Deterministic filtering boundary

Semantic retrieval is candidate generation. It does not replace EventHive business rules.

After KNN retrieval, explicit category and city filters are applied deterministically.

Future integrations can similarly apply active/upcoming status and date rules before presenting results.

## Security

All embedding and vector operations remain server-side. Existing application authentication and Firebase configuration are reused. No Google Cloud credentials are exposed to the frontend.

## Preservation of existing functionality

Phase 5.4 does not modify:

- authentication
- event creation/update
- RSVP behavior
- community requests
- Phase 2 deterministic trend logic
- Phase 3 Gemini explanation logic
- Phase 4 conversational orchestration
- Phase 5.1 embedding generation
- Phase 5.2 KNN implementation
- Phase 5.3 deterministic-plus-semantic conflict scoring
- Firestore event schema
- Firestore vector index definition

The existing `events` collection and `embedding` field remain unchanged.

## What Phase 5.4 does not implement

- autonomous actions
- event writes by AI
- semantic intent classification
- semantic trend clustering
- persistent chat storage
- conflict decisions based only on semantic similarity
- changes to the frontend UI

## Testing

Focused tests cover:

- semantic query validation
- EventHive-field query construction
- bounded result limits
- deterministic category/city post-filtering
- distance and semantic-similarity normalization
- removal of embedding metadata from domain results
- delegation to Phase 5.2 semantic similarity
- source-event exclusion for similar-event discovery
- domain-level controller contracts

Tests use mocked similarity services and event lookups rather than live Vertex AI or Firestore operations.

## Next phase

Phase 5.5 can build semantic trend clustering from the same embedding infrastructure and EventHive behavioral signals, while continuing to preserve deterministic metrics as the quantitative source of truth.
