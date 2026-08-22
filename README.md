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

Demo logins — the seed builds one account per role, so every screen has data:

| Role | Email | Password | Lands on |
| --- | --- | --- | --- |
| Traveller | `demo@globetrotter.app` | `demo1234` | `/dashboard` |
| Guide | `amelie@guides.globetrotter.app` | `guide1234` | `/guide` |
| Admin | `admin@globetrotter.app` | `admin1234` | `/admin` |

The traveller comes with **Europe Summer 2026** (Paris → Rome, 7 activities)
already built and Amelie already hired for the Paris days, so the app is never
demoed against an empty database. The other four seeded guides cover Rome,
Tokyo, Jaipur and Barcelona.

## Three roles, one users table

`users.role` is `USER | GUIDE | ADMIN`, and it is the only thing the API
authorises against. `requireRole(...)` in `middleware/auth.ts` gates every
router; the frontend mirrors it with `RoleGate` and a role-specific navbar so
nobody is shown a tab that would 403.

- **Traveller** browses `/guides`, hires one for a run of days, and sees that
  guide on `/bookings` and on the dashboard.
- **Guide** gets `/guide`: the travellers assigned to them, which days, and
  accept / decline / mark-complete. Their public listing lives on
  `/guide/profile`.
- **Admin** gets `/admin`: reassign a booking to a different guide, move its
  dates, force a status, verify or pause a guide, and change anyone's role.

**Contact details are earned, not browsed.** The directory never returns a
guide's phone or email. Both sides' contacts appear only once a booking reaches
`CONFIRMED` (`serializeBooking` decides this, not the UI), and admins always see
them because that is the support desk.

**A guide cannot be in two places at once.** Every booking write re-checks the
guide's calendar — inclusive day ranges, ignoring declined and cancelled rows —
and 409s with the clashing dates spelled out. Travellers get the same check
against their own bookings. Admin reassignment runs it too, and is the only path
that can override it, explicitly, with `force: true`.

**Prices are snapshots.** `guide_bookings.daily_rate` and `total_cost` are
written at booking time, so a guide raising their rate never rewrites what
someone already agreed to pay. Reassigning to a different guide deliberately
re-prices to the new guide's rate.

**Admins cannot demote themselves.** The one guardrail that stops the console
from being locked out.

## The data model

Eight tables. The whole design is in `backend/prisma/schema.prisma`.

```
users ──< trips ──< trip_stops >── cities
   │                    │              │
   │                    └──< stop_activities >── activities
   │
   ├──< guide_profiles >── cities
   └──< guide_bookings >── guide_profiles
```

- **`trip_stops`** is the join that makes this relational: one trip, many city
  stays, each with its own dates, costs and `sort_order`.
- **`guide_profiles`** is one-to-one with a `GUIDE` user and carries the area
  they cover, their rate and their languages. Demoting a guide parks the profile
  (`is_active = false`) rather than deleting the booking history hanging off it.
- **`guide_bookings`** joins a traveller to a guide for an inclusive day range,
  optionally attached to a trip. `days` counts both ends: the 1st to the 3rd is
  three days, not two.
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
│   ├── guide.service.js       guide lookups, day maths, double-booking guard
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
itinerary/calendar view, the public share page, and the three role workspaces
(`/guides`, `/bookings`, `/guide`, `/admin`) are all built. Signing in routes you
to your own home page — the edge proxy reads the role claim off the session token
for that, and every page re-checks it against the API. See
`frontend/README.md` for the full layout and how to run it, and `docs/API.md`
for the endpoint reference it's built against.
