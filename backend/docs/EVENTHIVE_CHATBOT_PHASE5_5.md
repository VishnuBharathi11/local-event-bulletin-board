# EventHive Chatbot Phase 5.5 — Semantic Trend Clustering

## Objective

Phase 5.5 adds a semantic trend-clustering layer over the Phase 5.1 embedding infrastructure and the populated `events.embedding` vectors. It groups semantically related events to identify emerging event themes without changing the deterministic Phase 2 trend calculations.

## Architecture

```text
Existing EventHive events
        ↓
Phase 5.1 embeddings
        ↓
Embedded event set
        ↓
Semantic similarity between event vectors
        ↓
Deterministic clustering threshold
        ↓
Meaningful semantic clusters
        ↓
Cluster summaries
```

The clustering service is an internal backend capability. It does not replace Phase 2 trend analysis.

## Inputs

Only existing event documents with a valid Phase 5.1 embedding are considered. The configured embedding dimensionality must match `EMBEDDING_DIMENSIONS` (currently 768). Events with missing or incompatible embeddings are skipped and reported.

The service continues to use the existing `events` collection. It does not create a separate semantic-events collection.

## Similarity

Phase 5.5 compares compatible event vectors with cosine similarity. The similarity is normalized to the range 0–1 and compared against a configurable threshold.

Default threshold:

```text
0.75
```

A cluster is seeded deterministically from the remaining event set. Events whose similarity to that seed meets the threshold are assigned to the cluster. Results are then ordered deterministically by cluster size, average similarity, and cluster identifier.

This implementation is intentionally bounded for the current application scale. The analysis limits the number of input events and returned clusters rather than introducing an additional clustering database or background service.

## Cluster output

Each meaningful cluster contains:

```text
clusterId
label
summary
  size
  topCategory
  topCity
  averageSimilarity
events[]
```

Embedding metadata is not exposed in cluster event output.

Clusters containing only one event are omitted from the meaningful trend result because a single event does not establish a semantic trend. Events that do not meet the compatibility threshold remain available for other clusters through the deterministic seed process.

## Example

Events such as:

```text
Python Workshop
Machine Learning Session
GenAI Workshop
```

can form a semantic cluster even when their titles differ. The cluster summary provides an interpretable category and location signal that later trend-ranking phases can combine with event creation velocity, RSVP activity, and community demand.

## Relationship to Phase 2

Phase 2 remains authoritative for deterministic trend metrics such as event counts, RSVP activity, category activity, location activity, event creation velocity, RSVP velocity, and community demand.

Phase 5.5 adds a semantic grouping signal:

```text
Deterministic metrics
       +
Semantic event clusters
       ↓
Future combined trend intelligence
```

No Phase 2 calculations are replaced.

## Security and data handling

Clustering uses event embeddings already stored server-side. No frontend credentials, authentication secrets, organizer credentials, cookies, JWTs, or private keys are sent to any model service during clustering.

No event documents are modified by the clustering analysis.

## What Phase 5.5 does NOT implement

- automatic event creation
- event modification
- RSVP modification
- semantic conflict decisions
- semantic chatbot routing
- persistent chat storage
- new Firestore collections
- new vector indexes
- frontend UI
- autonomous AI actions
- replacement of deterministic Phase 2 trend scoring

## Future consumption

A later intelligence phase can combine semantic clusters with deterministic trend signals to produce emerging-topic insights such as:

```text
AI / Machine Learning
Sports & Fitness
Student Networking
Community Workshops
```

The semantic cluster should be treated as supporting evidence. A cluster alone does not establish that a topic is trending until it is combined with temporal activity and engagement metrics.
