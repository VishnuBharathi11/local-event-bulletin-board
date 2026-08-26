# Local Event Bulletin Board

> A smart hyperlocal event coordination platform — built for Cognizant Hackathon 2026.

Most event apps make an organizer plan first and hope people show up. This platform flips that: the community expresses interest first, and an event only becomes real once enough demand exists. It also warns organizers when a new event is likely to clash with an existing one nearby, before either ever goes live.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Core Innovations](#core-innovations)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Scope](#scope)
- [Roadmap](#roadmap)
- [Team](#team)

---

## Problem Statement

Local events are shared through fragmented channels — messaging groups, social media, posters, and personal networks. This creates a handful of recurring problems:

- Organizers can't gauge interest before committing effort
- Similar events overlap and unintentionally split the audience
- There's no single place to discover what's happening nearby
- Expired events clutter active listings
- Small events (a badminton match, a study group) often never get posted at all — organizers fear being the only one who shows up

## Core Innovations

### 1. Demand-Driven Event Confirmation
Instead of an organizer creating an event and hoping people attend, users express interest first. A demand counter tracks how many people want the event. Once a configurable threshold is reached, the organizer is notified to review and confirm — the event is **never auto-published**, keeping the organizer in control of venue, timing, and execution.

```
Requested → Collecting Demand → Threshold Reached → Organizer Confirms → Published
```

### 2. Similar-Event Conflict Detection
Before a new event goes live, it's scored against existing nearby events on four weighted signals:

| Signal | Weight |
|---|---|
| Location match | 30 |
| Time overlap | 30 |
| Category match | 20 |
| Title/description similarity | 20 |

A score above the configurable threshold (default: 70) flags a potential conflict. This is **advisory only** — it never auto-cancels or blocks an event. The organizer always makes the final call.

## Features

**Core MVP**
- Event creation with validated fields
- Event board — cards with title, date, location, category, RSVP count, and demand/conflict status
- Search and filter by title, city, neighborhood, category, and date
- Chronological date sorting, with expired events excluded
- Category tags (Sports, Music, Food, Workshops, Meetups, Student Events, Garage Sale, Community)
- "I'm Going" RSVP counter with duplicate prevention
- Shareable per-event links (`/events/{eventId}`)
- Automatic expiration — instant query-level filtering, backed by Firestore TTL for background cleanup

**Innovations**
- Demand-driven event confirmation
- Similar-event conflict detection with an advisory alert

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js / Express, deployed on Google Cloud Run |
| Database | Firestore |
| Async processing | Pub/Sub *(used only where it provides real benefit — not added for its own sake)* |
| AI (optional) | Vertex AI, for semantic conflict similarity *(P2 — only if time permits)* |
| Observability | Cloud Logging + Cloud Monitoring |

## Architecture

```
User → HTTPS → Frontend (React)
                  │
                  ▼
        Backend REST API — Cloud Run
   (Event · Discovery · RSVP · Demand ·
    Conflict · Lifecycle · Sharing modules)
                  │
      ┌───────────┼───────────────┐
      ▼           ▼               ▼
  Firestore   Vertex AI (opt.)  Cloud Logging
  (events,    (semantic         → Cloud
  requests,   similarity)       Monitoring
  RSVPs,
  conflicts)
```

The backend is a single modular Cloud Run service rather than a microservices split — with a small team and a short build window, this keeps clean module boundaries without the deployment overhead of running several services.

## Data Model

**`events/{eventId}`**
`title, description, category, city, neighborhood, location, startTime, endTime, status, rsvpCount, demandCount, confirmationThreshold, conflictStatus, expireAt, organizerId, createdAt`

**`eventRequests/{requestId}`**
`eventType, description, city, neighborhood, requestedTime, interestCount, demandThreshold, status, createdAt`

**`eventRSVPs/{rsvpId}`**
`eventId, userId` — prevents duplicate RSVPs per event

**`eventConflicts/{conflictId}`**
`conflictScore, reasons, status`

## API Endpoints

```
POST   /events                         Create an event
GET    /events                         List events (sorted, non-expired)
GET    /events/:id                     Get a single event
GET    /events/calendar                Monthly calendar view
GET    /events/search                  Search / filter events
POST   /events/:id/rsvp                Increment RSVP count
GET    /events/:id/conflicts           Check for potential conflicts

POST   /event-requests                 Create a demand request
GET    /event-requests                 List demand requests
POST   /event-requests/:id/interest    Register interest ("I'm in")
```

## Getting Started

```bash
# clone the repo
git clone <repo-url>
cd local-event-bulletin-board

# backend
cd server
npm install
# add your Firestore service account credentials — see .env.example
npm run dev

# frontend
cd ../client
npm install
npm run dev
```

### Deployment (Cloud Run)

```bash
gcloud run deploy event-bulletin-board \
  --source . \
  --region <your-region> \
  --allow-unauthenticated
```

## Project Structure

```
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Event cards, forms, calendar, filters
│   │   ├── pages/
│   │   └── api/           # API client calls
├── server/                # Express backend on Cloud Run
│   ├── routes/
│   ├── modules/           # event, discovery, rsvp, demand, conflict, lifecycle
│   └── firestore/         # DB access layer
└── README.md
```

## Scope

**In scope:** event board, creation, search, categories, calendar, RSVP, shareable links, expiration, demand-driven confirmation, conflict detection, GCP deployment.

**Explicitly out of scope for this MVP:** paid ticketing, payment processing, reserved seating, QR-code ticket validation, full social-network features, advanced recommendation engine, historical timing prediction, mobile app.

## Roadmap

| Priority | Scope |
|---|---|
| P0 — MVP (built) | Event board, RSVP, search, categories, calendar, sharing, expiration, GCP deployment |
| P1 — Core Innovation (built) | Demand-driven confirmation, conflict detection |
| P2 — AI Enhancement (optional) | Semantic conflict similarity via Vertex AI |
| P3 — Future Roadmap | Advanced recommendations, historical timing analysis, notifications, maps, organizer analytics, mobile app |

## Team

Built for Cognizant Hackathon 2026.

| Area | Owner |
|---|---|
| Solution architecture | — |
| Event board & UI | — |
| Event creation & integration | — |
| Event APIs & backend | — |
| RSVP & lifecycle | — |
| Search, categories & sharing | — |
| GCP deployment | — |

---

*"The platform does more than publish events — it helps communities and organizers make better event decisions."*
