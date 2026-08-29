# Conflict API Contract

Priority 2 extends the existing conflict response without creating a new conflict endpoint.

## Check conflicts

`POST /events/conflicts/check`

The existing request body remains the event payload. The response remains:

```json
{
  "conflicts": [
    {
      "conflictId": "",
      "eventId": "",
      "conflictingEventId": "existing-event-id",
      "conflictScore": 82,
      "activitySimilarity": 0.78,
      "activityDomain": "Football",
      "activityReason": "Similar activity domain: Football",
      "reasons": [
        "Same city",
        "Same neighborhood",
        "Time overlaps with existing event",
        "Same event category",
        "Similar activity domain: Football"
      ],
      "status": "POTENTIAL",
      "createdAt": 0
    }
  ]
}
```

`conflictScore` remains the authoritative 0–100 Kotlin-derived score. `activitySimilarity` is a separate deterministic 0–1 signal and does not affect conflict thresholding or ordering.

`activityDomain` and `activityReason` are calculated dynamically. They are not persisted as new Firestore fields.

## Continue after review

`POST /events/conflicts/continue`

This existing endpoint continues to create the event after organizer review. The existing conflict records retain their established Firestore schema; the dynamic activity fields are deliberately removed before persistence.

## Compatibility

No new conflict endpoint, collection, event field, or Firestore schema migration is required.
