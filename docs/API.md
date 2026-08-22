# GlobeTrotter API

Base URL: `http://localhost:4000/api`

Auth is a JWT. Signup and login set an httpOnly `gt_session` cookie **and** return
the token in the body — use whichever suits the client. For a bearer token send
`Authorization: Bearer <token>`.

Errors always come back as `{ "error": { "message": "...", "details": [...] } }`.
`details` is present on validation failures as `[{ field, message }]`.

Money is a plain number in responses (never a string or a Decimal object).
Dates are `YYYY-MM-DD` strings; times are `HH:MM`.

---

## Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/signup` | `{ name, email, password, photoUrl? }` | password ≥ 8 chars → `201 { user, token }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, token }` |
| POST | `/auth/logout` | — | clears the cookie |
| GET | `/auth/me` | — | current user |
| PATCH | `/auth/me` | `{ name?, photoUrl? }` | profile edit |

Login and signup are rate limited to 40 attempts per 15 minutes per IP.

## Dashboard

| Method | Path | Returns |
|---|---|---|
| GET | `/dashboard` | `{ user, stats, recentTrips, upcomingTrips, recommendedCities }` |

## Trips

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/trips` | `?q=&scope=all\|upcoming\|past&limit=&offset=` | `{ trips, total, limit, offset }`, each with `stopCount` |
| POST | `/trips` | `{ name, startDate, endDate, description?, coverPhotoUrl?, targetBudget? }` | `201 { trip }` |
| GET | `/trips/:id` | — | **deep read**: `{ trip (with stops→city→activities), warnings, shareUrl }` |
| PATCH | `/trips/:id` | any create field, plus `isPublic` | |
| DELETE | `/trips/:id` | — | cascades to stops and their activities |
| GET | `/trips/:id/budget` | — | derived; see below |
| GET | `/trips/:id/itinerary` | — | day-by-day plan |
| POST | `/trips/:id/copy` | — | duplicates the trip, its stops and activities |
| POST | `/trips/:id/share` | — | `{ shareSlug, shareUrl, isPublic }` — reuses the existing slug |
| DELETE | `/trips/:id/share` | — | sets `isPublic:false`, keeps the slug so resharing restores the same link |

`GET /trips/:id` is the one call the builder, itinerary view and calendar all
render from.

### `warnings`

Non-blocking, returned with the deep read:

- `overlapping_stops` — two consecutive stays overlap by more than the handover day
- `outside_trip_dates` — a stop falls outside the trip's own window
- `empty_stop` — a stop has no activities yet

## Stops

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/trips/:id/stops` | — | ordered by `sortOrder` |
| POST | `/trips/:id/stops` | `{ cityId, arrivalDate, departureDate, transportCost?, accommodationCost?, notes? }` | appended at the end |
| PATCH | `/stops/:stopId` | any of the above | scheduled activities shift with the stop |
| DELETE | `/stops/:stopId` | — | |
| PATCH | `/trips/:id/stops/reorder` | see below | |

### Reordering

Send **every** stop of the trip, in its new left-to-right order. Two body shapes
are accepted:

```json
{ "order": [42, 17, 23] }
[{ "stopId": 42, "sortOrder": 1 }, { "stopId": 17, "sortOrder": 2 }]
```

**Dates re-flow by default.** Each stop keeps its number of nights and the stays
are re-chained back-to-back from the trip's start date, so the order and the
dates can never contradict each other. Scheduled activities move with their stop
by the same number of days. Pass `?keepDates=true` to reorder the cards only and
leave every date untouched.

`sortOrder` is written in gaps of 10 so a stop can be inserted between two
others without renumbering the rest.

## Activities on a stop

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/stops/:stopId/activities` | `{ activityId, scheduledDate?, scheduledTime?, customCost? }` | activity must belong to the stop's city; the date must sit inside the stay |
| PATCH | `/stop-activities/:id` | `{ scheduledDate?, scheduledTime?, customCost? }` | |
| DELETE | `/stop-activities/:id` | — | |

`customCost` overrides the catalogue price for this trip only — the shared
`activities` row is never mutated. Send `null` to fall back to the catalogue price.

## Catalogue (seeded reference data, no auth needed)

| Method | Path | Query |
|---|---|---|
| GET | `/cities` | `q, country, region, maxCostIndex, sort=popularity\|name\|cost, limit, offset` |
| GET | `/cities/:id` | — (includes `activityCount`) |
| GET | `/cities/:id/activities` | `q, category, maxCost, maxDuration, sort=cost\|name\|duration, limit, offset` |
| GET | `/activities` | same filters, searches across all cities |
| GET | `/activities/categories` | — |

Users pick from this catalogue; they never create cities or activities.

## Public share page

| Method | Path | Notes |
|---|---|---|
| GET | `/public/:slug` | **No auth.** `{ trip, itinerary, budget, readOnly: true }` |

Returns 404 when the owner has sharing switched off. The slug is a random
12-character nanoid, never the trip id, so trips cannot be enumerated. The
response strips `userId` and `shareSlug` — a read-only viewer gets the trip and
the owner's display name, nothing else.

---

## The budget response

Nothing here is stored. `GET /trips/:id/budget` derives every figure at read
time from one join across `trip_stops`, `cities`, `stop_activities` and
`activities` (see `src/services/budget.service.js`).

```json
{
  "budget": {
    "tripId": 1,
    "currency": "USD",
    "totals": { "transport": 360, "accommodation": 1000, "activities": 116, "grandTotal": 1476 },
    "breakdown": [ { "name": "Transport", "value": 360 }, ... ],
    "byStop": [ { "stopId": 7, "city": "Paris", "transport": 220, "accommodation": 480,
                  "activities": 46, "activityCount": 2, "total": 746 } ],
    "byCategory": [ { "category": "food", "count": 1, "total": 70 } ],
    "perDay": 184.5,
    "tripDays": 8,
    "target": { "budget": 2500, "spent": 1476, "remaining": 1024,
                "percentUsed": 59.04, "status": "healthy" }
  }
}
```

`breakdown` is ready to hand straight to a Recharts pie. `target.status` is
`healthy` (< 75%), `warning` (75–100%), `over` (> 100%) or `unset` when the trip
has no `targetBudget` — that drives the budget health bar.
