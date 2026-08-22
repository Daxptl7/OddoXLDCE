# GlobeTrotter — frontend

Next.js (App Router) + TypeScript. Talks to the Express/Prisma backend in
`../backend` — see `../docs/API.md` for the endpoint reference this app is
built against.

```
src/
  app/
    (auth)/login, (auth)/signup     sign in / sign up
    (app)/dashboard                 stats, recent + upcoming trips, recommended cities
    (app)/trips                     search/filter + create a trip
    (app)/trips/[id]                the builder: stops, reorder, activities, budget, itinerary, calendar
    (app)/profile                   edit name / photo
    t/[slug]                        public, read-only share page (no auth) — matches the
                                     backend's shareUrl shape (/t/:slug)
  components/
    ui/            Button, Input, Modal, Card, Badge, EmptyState, Spinner, ErrorBanner
    trips/         StopList (drag-to-reorder via dnd-kit), StopFormModal, ActivityPicker,
                   CitySearchCombobox, WarningsBanner, CreateTripModal, EditTripModal
    budget/        BudgetHealthBar, BudgetBreakdownChart (pie), BudgetByStopChart (bar)
    itinerary/     ItineraryDayList, CalendarGrid
  lib/
    api/client.ts       typed fetch wrapper — attaches the bearer token, throws ApiError
    api/endpoints.ts    one function per backend endpoint
    auth/               token cookie helpers + AuthContext (login/signup/logout/me)
    types.ts            wire types matching the backend's serializers
  hooks/           TanStack Query hooks per resource (useTrips, useTrip, useBudget, …)
  proxy.ts         edge auth gate — redirects based on whether the token cookie exists
```

## Auth model

The backend issues a JWT on login/signup and accepts it either as an httpOnly
cookie or as `Authorization: Bearer <token>` (see `docs/API.md`). This app uses
the **bearer token** path: the token is stored in a regular (non-httpOnly)
cookie by the client after login, and sent as a header on every request. This
avoids cross-origin cookie issues between the Next.js dev server and the
Express API running on a different port. `src/proxy.ts` does a cheap
edge-side check for that cookie to gate `/dashboard`, `/trips`, `/profile`;
`AuthContext` calls `GET /auth/me` on load, which is the real check.

## Running it locally

You need the backend running first (it owns the database):

```bash
cd backend
npm install
cp .env.example .env             # then edit DATABASE_URL / JWT_SECRET
createdb globetrotter
npm run db:migrate
npm run db:seed                  # 32 cities, 143 activities, one demo trip
npm run dev                      # http://localhost:4000
```

Confirm it's up: `curl "http://localhost:4000/api/cities?q=par"` should return Paris.

Then, in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local       # NEXT_PUBLIC_API_URL, defaults to localhost:4000/api
npm run dev                      # http://localhost:3000
```

Open `http://localhost:3000` — it redirects to `/login`. Sign up, or use the
seeded demo account: **demo@globetrotter.app** / **demo1234** (comes with
"Europe Summer 2026", Paris → Rome, already built).

### One thing to double-check in `backend/.env`

The backend's CORS and share-link config default to the frontend's origin.
Make sure `backend/.env` has:

```
CORS_ORIGIN="http://localhost:3000"
PUBLIC_APP_URL="http://localhost:3000"
```

(`backend/.env.example` already has these defaults — only relevant if your
`.env` predates this frontend and still points at Vite's `:5173`.)

## Build / typecheck

```bash
npm run build       # next build — full type check + production build
npx tsc --noEmit    # type-only check, faster during development
```
