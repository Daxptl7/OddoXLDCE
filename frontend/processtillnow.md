# GlobeTrotter frontend — process so far

## 1. Starting point

`frontend/` was a placeholder: a Vite + JS scaffold with only an untyped
`fetch` wrapper (`src/api/client.js`, `src/api/index.js`) and no UI. The
backend (Express + Prisma + PostgreSQL, in `../backend`) was fully built and
documented in `../docs/API.md`.

## 2. Rebuild: Next.js + TypeScript

Replaced the Vite scaffold in place with a Next.js 16 (App Router) +
TypeScript app (`create-next-app` with Tailwind CSS v4), then added:
`@tanstack/react-query`, `react-hook-form` + `zod` + `@hookform/resolvers`,
`recharts`, `@dnd-kit/*`, `js-cookie`, `date-fns`, `clsx`.

**Auth model.** The backend issues a JWT and accepts it as either an httpOnly
cookie or `Authorization: Bearer <token>`. Chosen approach: store the token
client-side in a regular (non-httpOnly) cookie (`gt_token`) after
login/signup, send it as a bearer header on every request. Avoids
cross-origin cookie friction between the Next.js dev server and the Express
API on a different port. `src/proxy.ts` (Next 16 renamed `middleware.ts` to
`proxy.ts`) does a cheap edge check for that cookie's presence to gate
protected routes; `AuthContext` calling `GET /auth/me` on load is the
authoritative check.

**Typed contract layer** (`src/lib/`):
- `types.ts` — wire types copied straight from the backend's
  `src/types/index.ts` and `services/serializers.ts` (no guessing field names).
- `api/client.ts` — typed fetch wrapper, attaches the bearer token, throws
  `ApiError` with `status`/`message`/`details`.
- `api/endpoints.ts` — one function per backend endpoint (auth, dashboard,
  trips, stops, stopActivities, catalogue, publicTrips).
- `auth/token.ts` + `auth/AuthContext.tsx` — cookie helpers + the
  login/signup/logout/me context.

**Pages/features built** (full MUST-HAVE scope from `plan.md`):
- `(auth)/login`, `(auth)/signup` — react-hook-form + zod forms.
- `(app)/dashboard` — stats, recent/upcoming trips, recommended cities.
- `(app)/trips` — search/filter + create-trip modal.
- `(app)/trips/[id]` — the core builder: stop list with drag-to-reorder
  (dnd-kit), add/edit/delete stop, city search, activity picker with
  cost-override, warnings banner, share/unshare, copy trip, delete trip, plus
  Budget (Recharts pie + bar + health bar) and Itinerary/Calendar tabs, all
  driven by one deep trip read per the backend's own design.
- `(app)/profile` — edit name/photo.
- `t/[slug]` — public, no-auth, server-rendered share page (matches the
  backend's `shareUrl` shape of `/t/:slug`).
- `src/hooks/` — one TanStack Query hook per resource, with mutations
  invalidating the trip/budget/itinerary queries together so nothing goes
  stale after an edit.

**Verification done:** `npx tsc --noEmit`, `npm run lint`, and `npm run build`
all pass clean. Also booted `next dev` and confirmed `/`, `/login`, `/signup`
render and the proxy auth-redirect works. Full live E2E against the backend
(signup → build a trip → budget updates → share link) hasn't been run in this
environment — no local Postgres/Docker daemon was available — but is
documented step-by-step in `frontend/README.md`.

Along the way, fixed a few dependency-version friction points worth knowing
about if they resurface:
- `zod` v4 + `@hookform/resolvers` v5: `z.coerce.number()` on a form field
  produces an `input` type of `unknown`, which conflicts with
  `useForm<FormValues>`'s single generic. Fixed by keeping numeric form
  fields as plain `z.string()` with a numeric-format `refine`, and converting
  to `Number(...)` at the mutation call site, instead of fighting the
  input/output generic split.
- The new `react-hooks/set-state-in-effect` lint rule flags the standard
  "fetch current user on mount" pattern in `AuthContext` even though every
  `setState` call happens after an `await`. Added a targeted
  `eslint-disable-next-line` with a comment explaining why, rather than
  restructuring away from a well-understood pattern.
- `useSearchParams()` on `/login` needs a `<Suspense>` boundary for static
  prerendering to succeed — split the page into a thin wrapper + inner
  `LoginForm` component.

## 3. Public homepage (in progress)

The user asked for a marketing homepage at `/` (previously `/` just redirected
straight to `/login`), with a navbar (Home / Workflow / Login / Sign Up) that
starts transparent over the hero and turns solid on scroll, referencing a
screenshot of an unrelated site ("AgroPulse") purely for that layout/behavior
pattern — not its soil/agriculture content.

Built:
- `src/proxy.ts` — changed so `/` only redirects when a token cookie is
  present (→ `/dashboard`); logged-out visitors now see the homepage instead
  of being force-redirected to `/login`.
- `src/components/home/PublicNavbar.tsx` — client component, `fixed` header,
  transparent until `scrollY > 24`, then `bg-slate-900/95` + blur.
- `src/components/home/HeroScroller.tsx` — the two newly-added images in
  `public/` (`Hot-Air-Balloon-Flights_..._Cappadocia_..._Balloon-Tour-1.jpg`
  and `tropical-island-aerial-view.jpg`) laid out as a 4-wide flex row
  (`[img1, img2, img1-dup, img2-dup]`, each `w-screen`) animated via a CSS
  keyframe, so it loops seamlessly forever (the duplicate pair makes the
  loop point visually indistinguishable from the start).
- `src/components/home/WorkflowSection.tsx` — a small 3-step "how it works"
  section, anchored at `#workflow` so the navbar's Workflow link has
  somewhere real to go.
- `src/app/page.tsx` — the homepage itself: hero text overlay, "Get
  Started"/"Login" CTAs, a social-proof row (avatars + rating), and the
  Workflow section below the fold.
- `src/app/globals.css` — the `hero-scroll-x` keyframe animation.

**Animation timing — revised mid-implementation.** First pass made the whole
2-image loop complete in a continuous 4s scroll. The user then asked instead
for each image to **hold for 4 seconds, then do a quick scroll transition** to
the next one (a "delay before scrolling" pattern, not a continuous scroll).
Current keyframe (in `globals.css`):

```css
@keyframes hero-scroll-x {
  0%, 40%  { transform: translateX(0); }       /* hold image 1 */
  50%, 90% { transform: translateX(-100vw); }  /* hold image 2 */
  100%     { transform: translateX(-200vw); }  /* scroll back to (visually) image 1 */
}
.animate-hero-scroll {
  animation: hero-scroll-x 10s linear infinite;
}
```
10s total cycle = 4s hold + 1s scroll + 4s hold + 1s scroll. `tsc`, `lint`
were re-run clean after this change.

**Not yet done:** a fresh visual verification of this new hold-then-scroll
timing (a Playwright screenshot pass at several timestamps was queued but
interrupted before running). That's the next thing to confirm before calling
the homepage finished — screenshot at ~0.5s (should show image 1 static),
~3.9s (still image 1, about to move), ~4.5s (mid-scroll), ~6s (image 2
static), etc., matching the keyframe percentages above.

## Environment notes for next time

No local Postgres or running Docker daemon in this sandbox — full live E2E
against the backend (signup, build a trip, budget math, share link) has not
been run here; only build/lint/typecheck and static-page rendering have been
verified. Playwright + Chromium were installed ad hoc into the scratchpad
directory to take screenshots (not part of the repo).
