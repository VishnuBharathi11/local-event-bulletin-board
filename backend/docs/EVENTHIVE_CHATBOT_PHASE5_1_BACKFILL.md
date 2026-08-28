# EventHive Phase 5.1 — Existing Event Embedding Backfill

## Purpose

This is an explicit administrative operation for populating Phase 5.1 embeddings on existing EventHive documents in the `events` collection.

It is not part of server startup and is not connected to event creation, event updates, RSVP, authentication, chatbot orchestration, or frontend code.

## Execution

From the repository root:

```powershell
node backend/src/admin/backfillEventEmbeddings.js
```

Or from the `backend` directory:

```powershell
node src/admin/backfillEventEmbeddings.js
```

The operator must provide the same server-side Firebase Admin and Google Application Default Credentials/environment required by the existing Phase 5.1 embedding service.

## Processing flow

```text
existing events collection
        ↓
validate event document
        ↓
existing eventEmbeddingPipeline
        ↓
existing canonicalization
        ↓
existing Vertex AI embedding service
        ↓
768-dimensional validation
        ↓
existing eventEmbeddingRepository
        ↓
merge embedding metadata into events/{eventId}
```

The existing pipeline and repository remain responsible for canonicalization, embedding generation, vector validation, and Firestore merge persistence. The backfill only enumerates existing documents and coordinates those operations.

## Safety

The operation is safe to rerun. Re-running regenerates the embedding for each valid event and merges the current Phase 5.1 metadata into the existing event document. It does not replace the event document.

An individual event failure does not stop the remaining events. Failures are collected and reported at the end, and the process exits unsuccessfully when one or more events fail so an operator can investigate them.

Invalid event documents are skipped and reported separately.

No credentials, access tokens, private keys, cookies, or signed image URLs are logged by the backfill implementation.

## Result summary

The operation reports:

```text
{
  "totalEvents": <number>,
  "successfullyEmbedded": <number>,
  "skipped": <number>,
  "failed": <number>,
  "failures": [...],
  "skippedEvents": [...]
}
```

The event data remains authoritative. Only the supplementary Phase 5.1 embedding fields are written through the existing merge-based repository.

## Scope boundary

This operation does not add automatic embedding triggers, new collections, new endpoints, semantic conflict detection, semantic chatbot search, trend clustering, or any frontend behavior.
