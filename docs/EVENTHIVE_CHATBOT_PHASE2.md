# EventHive Assistant — Phase 2 Deterministic Trend Intelligence

## Objective

Phase 2 adds a deterministic intelligence layer over verified EventHive application data. It does not use Gemini or another generative model.

## Data sources

The trend engine reads the existing `events` and active `eventRequests` collections through the repository layer. Event records already contain `createdAt`, `startTime`, `endTime`, `category`, `city`, and `rsvpCount`. Community requests contain `createdAt`, `category`, `city`, `demandCount`, `demandThreshold`, and `status`.

## Metrics

The service calculates:

- Event supply: events created in the selected analysis window.
- Upcoming supply: non-expired events whose start time is still in the future.
- RSVP activity: total and average RSVPs per event.
- Event creation velocity: comparison of event creation rate in the first and second halves of the analysis window.
- Category activity: number of events per category.
- Location activity: number of events per city.
- Category RSVP activity: RSVPs aggregated by category.
- Location RSVP activity: RSVPs aggregated by city.
- Community demand: active requests, total demand, and threshold-reached requests.
- High-demand categories and cities: community demand aggregated by category and city.

## Deterministic ranking

Hot categories are ranked by total RSVP activity, followed by event count, followed by category name for deterministic tie-breaking.

No model-generated interpretation is used. The output is a structured evidence set intended for the future Gemini explanation layer.

## Endpoint

`GET /api/chatbot/tools/trend-analysis`

Optional query parameters:

- `days` — analysis window, default 30, maximum 90.
- `category` — exact case-insensitive category filter.
- `city` — exact case-insensitive city filter.

## Example

`GET /api/chatbot/tools/trend-analysis?days=30&city=Coimbatore`

The response contains `window`, `filters`, `signals`, and `insights`. The endpoint is read-only.

## Phase boundary

Phase 2 intentionally does not:

- call Gemini;
- generate natural-language explanations;
- perform semantic similarity;
- create or modify events;
- modify RSVP or community-request records.

Phase 3 will consume this verified deterministic output and add Gemini-based explanation/orchestration behind the backend boundary.
