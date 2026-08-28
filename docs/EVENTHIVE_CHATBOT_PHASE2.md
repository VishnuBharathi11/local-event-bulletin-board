# EventHive Assistant — Phase 2 Deterministic Trend Intelligence

## Objective

Phase 2 adds a deterministic intelligence layer over verified EventHive application data. It does not use Gemini or another generative model.

## Data sources

The trend engine reads the existing `events`, `eventRSVPs`, and active `eventRequests` collections through the repository layer. Event records provide `createdAt`, `startTime`, `endTime`, `category`, `city`, and `rsvpCount`. RSVP records provide `eventId` and `createdAt`. Community requests provide `createdAt`, `category`, `city`, `demandCount`, `demandThreshold`, and `status`.

## Metrics

The service calculates event supply, upcoming supply, total and average RSVP engagement, event creation velocity, RSVP velocity, category activity, location activity, category/location RSVP engagement, and community demand. Community demand includes total demand and requests that reached their threshold.

Hot categories are ranked deterministically by total RSVP engagement, then event count, then name. High-demand categories and cities are ranked by community-request demand.

## Endpoint

`GET /api/chatbot/tools/trend-analysis`

Optional query parameters:

- `days` — analysis window, default 30, maximum 90.
- `category` — exact case-insensitive category filter.
- `city` — exact case-insensitive city filter.

Example:

`GET /api/chatbot/tools/trend-analysis?days=30&city=Coimbatore`

The response contains `window`, `filters`, `signals`, and `insights`. The endpoint is read-only.

## Phase boundary

Phase 2 intentionally does not call Gemini, generate natural-language explanations, perform semantic similarity, or mutate EventHive records. Its output is structured evidence for the future Gemini explanation layer.

Phase 3 will consume this verified deterministic output and add Gemini-based explanation/orchestration behind the backend boundary.
