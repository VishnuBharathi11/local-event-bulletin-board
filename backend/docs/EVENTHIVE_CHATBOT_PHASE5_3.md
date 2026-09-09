# EventHive Phase 5.3 — Semantic Conflict Intelligence

## Objective

Phase 5.3 combines the existing deterministic EventHive conflict analysis with semantic similarity evidence from the Phase 5.2 Firestore vector-search layer.

The design is:

```text
Proposed Event
     ↓
Deterministic conflict analysis
(time + location + category + title/activity rules)
     +
Semantic candidate retrieval
(Vertex AI embedding → Firestore KNN)
     ↓
Combined conflict evidence
     ↓
Existing deterministic conflict threshold
```

Semantic similarity is supporting evidence. It does not independently declare an event conflict.

## Existing deterministic intelligence remains authoritative

The existing `conflictDetectionService.js` continues to calculate the baseline conflict score and existing business rules. Phase 5.3 does not replace those rules.

The semantic layer can contribute up to 20 additional points when the cosine-derived semantic similarity is at or above the configured semantic threshold.

The existing conflict threshold remains the final decision boundary.

This prevents a semantically similar event at a different time/location from being incorrectly classified as a conflict solely because its description is similar.

## Semantic similarity signal

`semanticConflictAnalyzer.js` uses the Phase 5.2 `findSimilarEvents()` service.

The query path is:

```text
canonical proposed event text
        ↓
RETRIEVAL_QUERY embedding
        ↓
Firestore KNN query on events.embedding
        ↓
candidate events + distance
        ↓
cosine distance → semantic similarity
        ↓
deterministic conflict enrichment
```

The Phase 5.2 vector-search configuration remains:

```text
model:       gemini-embedding-001
task type:   RETRIEVAL_QUERY
dimensions:  768
distance:    COSINE
```

Firestore cosine distance decreases as vectors become more similar. A distance of `0` corresponds to identical vector direction, while larger values indicate less similarity. The current Firebase documentation specifies that cosine distance ranges from `0` to `2`. citehttps://firebase.google.com/docs/firestore/vector-search?hl=en

The Phase 5.3 service converts cosine distance to a bounded similarity score using:

```text
semanticSimilarity = 1 - cosineDistance
```

clamped to `[0, 1]`.

## Semantic threshold

The default threshold is:

```text
SEMANTIC_CONFLICT_SIMILARITY_THRESHOLD=0.75
```

It is configurable through the server environment.

A semantic similarity below the threshold adds no semantic score.

A similarity at or above the threshold adds a bounded semantic contribution of up to 20 points to the deterministic conflict score.

## Conflict decision policy

The final decision remains:

```text
combinedScore >= existing CONFLICT_THRESHOLD
        ↓
POTENTIAL_CONFLICT
```

The semantic signal alone cannot bypass this threshold.

For example, two events with almost identical descriptions but no time overlap and no meaningful location/category relationship should not become a conflict solely because of semantic similarity.

## Returned evidence

A combined semantic conflict result contains the existing deterministic conflict information plus:

```text
semanticSimilarity
semanticDistance
semanticScore
semanticThreshold
semanticEvidence
deterministicConflictScore
conflictThreshold
semanticDecision
```

The associated candidate event is returned without its embedding metadata. Raw vector data is not exposed as event-facing semantic content.

## Integration boundary

Phase 5.3 adds an isolated `detectSemanticConflicts()` capability. It does not rewrite the existing `checkConflicts()` path or force Vertex AI into ordinary event creation.

This keeps existing EventHive event creation behavior deterministic and backward compatible while the semantic conflict layer is evaluated separately.

A later integration step can deliberately decide where and when semantic conflict intelligence should participate in the product workflow.

## Security

The semantic conflict layer never sends Firebase credentials, JWT secrets, cookies, organizer credentials, or authentication tokens to Vertex AI.

Only the canonical event representation is embedded.

Candidate event embedding metadata is removed before the candidate is exposed through the semantic conflict result.

## Testing

Focused tests are located in:

```text
backend/src/services/semanticConflictService.test.js
backend/src/services/semanticConflictAnalyzer.test.js
```

They cover:

- semantic similarity threshold validation
- cosine distance conversion
- semantic score bounds
- semantic evidence enrichment
- preservation of deterministic conflict scoring
- low-semantic-similarity behavior
- deterministic conflict threshold authority
- KNN candidate retrieval
- configured cosine search
- removal of embedding metadata from returned event details
- semantic similarity alone not bypassing the deterministic conflict threshold

All vector-search calls are mocked for unit testing. No live Vertex AI or Firestore credentials are required for the focused test suite.

## What Phase 5.3 does not implement

Phase 5.3 does not add:

- semantic chatbot routing
- automatic semantic event creation checks
- persistent conflict decision storage
- new Firestore collections
- new API endpoints
- frontend changes
- trend clustering
- similar-event UI
- autonomous actions
- replacement of deterministic conflict detection

## Next semantic phase

A future phase can integrate `detectSemanticConflicts()` into the appropriate existing conflict workflow after local and live evaluation establish the desired thresholds and false-positive behavior.
