# GlobeTrotter

Multi-city trip planner. Plan a trip across several cities, attach activities to
each stay, and watch the budget derive itself from the itinerary.

```
OddoxLDCE/
├── backend/          Node + Express + Prisma + PostgreSQL  ← built
├── frontend/         Next.js + TypeScript + Tailwind        ← built
├── docs/API.md       endpoint reference
└── plan.md           the build plan
```

## Running the backend

```bash
cd backend
npm install
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
createdb globetrotter
npm run db:migrate            # creates the tables
npm run db:seed               # 32 cities, 143 activities, one demo trip
npm run dev                   # http://localhost:4000
```

Check it: `curl "http://localhost:4000/api/cities?q=par"` returns Paris.

Demo login: `demo@globetrotter.app` / `demo1234` — comes with **Europe Summer
2026** (Paris → Rome, 7 activities) already built, so the app is never demoed
against an empty database.

## The data model

Six tables. The whole design is in `backend/prisma/schema.prisma`.

```
users ──< trips ──< trip_stops >── cities
                        │              │
                        └──< stop_activities >── activities
```

- **`trip_stops`** is the join that makes this relational: one trip, many city
  stays, each with its own dates, costs and `sort_order`.
- **`sort_order`** is written in gaps of 10, so reordering is an integer update
  and inserting between two stops never renumbers the rest.
- **`stop_activities.custom_cost`** lets a user override a catalogue price for
  their trip without mutating the shared `activities` row.
- **`share_slug`** is a random 12-character nanoid, never the trip id — sequential
  ids would let anyone enumerate other people's trips.
- **Cities and activities are seeded reference data.** Users pick from the
  catalogue, they never create rows in it, which is what keeps costs comparable.

## The budget is derived, never stored

There is no total-cost column anywhere. `GET /trips/:id/budget` computes the
whole cost-breakdown screen from one query across four tables:

```sql
SELECT ts.id, c.name, ts.transport_cost, ts.accommodation_cost,
       COALESCE(SUM(COALESCE(sa.custom_cost, a.estimated_cost)), 0) AS activity_cost
FROM trip_stops ts
JOIN cities c                ON c.id = ts.city_id
LEFT JOIN stop_activities sa ON sa.trip_stop_id = ts.id
LEFT JOIN activities a       ON a.id = sa.activity_id
WHERE ts.trip_id = $1
GROUP BY ts.id, c.name
ORDER BY ts.sort_order;
```

Add an activity and every number moves. `COALESCE(sa.custom_cost,
a.estimated_cost)` is the override rule; the outer `COALESCE` is what keeps a
stop with no activities at 0 instead of null.

## Decisions worth knowing

**Reordering re-flows the dates.** Each stop keeps its nights and the stays
re-chain back-to-back from the trip start date, so the order and the dates can
never disagree. Scheduled activities shift with their stop. `?keepDates=true`
opts out. (The plan flagged this as a pick-one-and-be-consistent decision.)

**Warnings, not blocks.** Overlapping stays, stops outside the trip window and
empty stops come back as `warnings` on the deep trip read. The user is told;
they are not stopped.

**Activities are city-scoped.** Attaching a Louvre tour to the Rome stop is a
400, not a silent success.

**The public page takes no auth.** `GET /api/public/:slug` has no auth middleware
anywhere on its router, returns 404 the moment sharing is switched off, and
strips `userId` and `shareSlug` from the response.

## Backend layout

```
backend/src/
├── server.js            entry point, graceful shutdown
├── app.js               express app: helmet, cors, rate limits, routes
├── config/env.js        env parsing, fails fast on missing vars
├── routes/              one router per resource
├── controllers/         request → service → response
├── services/
│   ├── budget.service.js      the derived budget (raw SQL)
│   ├── itinerary.service.js   day-by-day plan for the itinerary + calendar views
│   ├── stop.service.js        sort_order, reordering, date re-flow
│   ├── trip.service.js        ownership checks, deep include, warnings
│   └── serializers.js         Decimal → number, Date → YYYY-MM-DD
├── middleware/          auth, zod validation, param coercion, error handler
├── validators/          zod schemas
└── utils/               dates, money, errors, hashing and tokens
```

Every user-scoped route resolves the record and checks ownership before touching
it — `getOwnedTrip`, `getOwnedStop`, `getOwnedStopActivity` in
`services/trip.service.js` and `controllers/stop.controller.js`.

## Frontend

Next.js (App Router) + TypeScript, talking to the API above via a typed client
and TanStack Query. Auth, dashboard, trip CRUD, the itinerary builder
(add/reorder stops, attach activities), the derived budget with charts, the
itinerary/calendar view, and the public share page are all built. See
`frontend/README.md` for the full layout and how to run it, and `docs/API.md`
for the endpoint reference it's built against.
