# GlobeTrotter — Hackathon Build Plan & Analysis

---

## 1. What this brief is actually testing

The problem statement lists 13 screens, but read the *Mission* section again — it names five capabilities and one non-negotiable:

> "must demonstrate proper use of relational databases to store and retrieve complex travel data"

That single line tells you where the marks are. This is a **data-modelling problem wearing a travel-app costume**. A team that ships 13 half-broken screens on a flat JSON blob will lose to a team that ships 7 solid screens on a clean normalized schema with real joins.

**Three things the judges will actually check:**

| What they check | How they check it |
|---|---|
| Does the data model handle real complexity? | "Can I add 3 cities to one trip, reorder them, and have the dates stay correct?" |
| Does the app compute, not just store? | Budget must *derive* from activities + stays, not be a number you typed in. |
| Does a stranger see the trip? | Public share link opened in an incognito window. |

Everything else is polish.

---

## 2. The scope trap (read this before you write code)

13 screens ÷ typical hackathon time = ~1.5 hours per screen including backend, styling, and debugging. That is not achievable. Every team that tries this demos a broken app.

**The fix: build one complete vertical slice, then widen it.**

Your demo is a story, not a feature list. The story is:

> Sign up → create "Europe Summer 2026" → add Paris (3 days) + Rome (4 days) → attach activities → watch the budget auto-calculate → see it laid out on a calendar → share a public link → judge opens it on their phone.

That loop touches screens 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11. Which is to say: **the loop is the product.** Build the loop end-to-end at low fidelity first, then make it pretty. Never build a screen that isn't on this path until the path works.

---

## 3. Feature list — prioritized

### MUST HAVE (this is your demo; nothing ships without it)

| # | Feature | Why it's essential | Rough cost |
|---|---|---|---|
| 1 | Auth (signup/login/session) | Gate for everything user-scoped | 2h — use a library, do NOT hand-roll JWT |
| 2 | Create Trip (name, dates, description) | Root entity | 1h |
| 3 | My Trips list | Proves persistence + user scoping | 1h |
| 4 | **Itinerary Builder** — add stop, pick city, set date range, reorder | ⭐ The heart of the app | 4-5h |
| 5 | City search + "Add to Trip" | Feeds the builder | 2h |
| 6 | Activity search + attach to a stop | Where cost data comes from | 2-3h |
| 7 | **Auto-calculated budget + breakdown chart** | ⭐ The "it thinks" moment | 2h |
| 8 | Itinerary View (day-wise, grouped by city) | The payoff screen | 2h |
| 9 | **Public share link (read-only, no auth)** | ⭐ The closing move of the demo | 1.5h |

The three starred items are your scoring differentiators. If you're running out of time, cut *anything* before you cut those.

### SHOULD HAVE (add only when MUST is fully working)

- Calendar/timeline view toggle (list ↔ calendar)
- Dashboard with recent trips + recommended cities
- Trip cover photo upload
- Activity filters (type / cost / duration)
- Basic profile edit page
- "Copy this trip" button on the public page

### COULD HAVE (only if you're somehow ahead — you won't be)

- Drag-to-reorder activities within a day
- Overbudget day alerts
- Admin analytics dashboard
- Social media share buttons
- Language preference, saved destinations
- Forgot-password email flow

### WON'T HAVE (say this out loud to your team now)

Real flight/hotel APIs, payments, live collaboration, mobile native app, AI trip generation, multi-currency FX rates. All of these are demo-killers disguised as impressive features. Mention them as "roadmap" in your pitch instead.

---

## 4. The data model

This is where you win. Design it before you write a single component.

```
users
  id (PK) · email (UNIQUE) · password_hash · name · photo_url · created_at

trips
  id (PK) · user_id (FK→users) · name · description · start_date · end_date
  cover_photo_url · is_public (bool) · share_slug (UNIQUE, nullable) · created_at

cities                        -- seed this, don't let users create cities
  id (PK) · name · country · region · cost_index (int 1-5)
  popularity (int) · image_url · latitude · longitude

trip_stops                    -- the join that makes this a real relational app
  id (PK) · trip_id (FK→trips) · city_id (FK→cities)
  arrival_date · departure_date
  sort_order (int)            -- how you reorder cities
  transport_cost · accommodation_cost
  UNIQUE(trip_id, sort_order)

activities                    -- seed catalogue
  id (PK) · city_id (FK→cities) · name · description · category
  estimated_cost · duration_minutes · image_url

stop_activities               -- user's chosen activities for a specific stop
  id (PK) · trip_stop_id (FK→trip_stops) · activity_id (FK→activities)
  scheduled_date · scheduled_time · custom_cost (nullable, overrides default)
```

**Notes that will save you pain:**

- `sort_order` on `trip_stops` is how "reorder cities" works. Reordering = updating integers, not deleting and re-inserting rows. Consider using gaps (10, 20, 30) so you can insert between without renumbering everything.
- `share_slug` should be a random string (`nanoid`), not the trip ID. Sequential IDs let judges enumerate other people's trips — someone will try this.
- `custom_cost` on `stop_activities` lets users override the catalogue price without mutating shared catalogue data. Small field, big correctness win.
- Seed **~30 cities and ~100 activities** before the hackathon starts if allowed, or in your first hour. An empty search bar is the single most common demo failure. Make sure your seed includes obvious crowd-pleasers: Paris, Tokyo, Rome, Bali, New York.

**The budget query** — this is your "proper use of relational databases" showpiece. Have it ready to explain:

```sql
SELECT
  ts.id AS stop_id,
  c.name AS city,
  ts.transport_cost,
  ts.accommodation_cost,
  COALESCE(SUM(COALESCE(sa.custom_cost, a.estimated_cost)), 0) AS activity_cost
FROM trip_stops ts
JOIN cities c            ON c.id = ts.city_id
LEFT JOIN stop_activities sa ON sa.trip_stop_id = ts.id
LEFT JOIN activities a       ON a.id = sa.activity_id
WHERE ts.trip_id = $1
GROUP BY ts.id, c.name
ORDER BY ts.sort_order;
```

One query, four tables, produces the entire cost-breakdown screen. When a judge asks "show me your database work," you show them this.

---

## 5. API surface

Keep it boring and RESTful. ~15 endpoints covers the MUST list.

```
POST   /auth/signup
POST   /auth/login
POST   /auth/logout
GET    /me

GET    /trips                       -- current user's trips
POST   /trips
GET    /trips/:id                   -- deep: stops + activities nested
PATCH  /trips/:id
DELETE /trips/:id

POST   /trips/:id/stops
PATCH  /stops/:stopId               -- dates, costs
DELETE /stops/:stopId
PATCH  /trips/:id/stops/reorder     -- body: [{stopId, sortOrder}, ...]

POST   /stops/:stopId/activities
DELETE /stop-activities/:id

GET    /cities?q=&country=          -- search
GET    /cities/:id/activities?category=&maxCost=

GET    /trips/:id/budget            -- the derived breakdown
POST   /trips/:id/share             -- generates share_slug, sets is_public
GET    /public/:slug                -- NO AUTH. read-only.
```

`GET /trips/:id` returning the fully nested object is worth it — the itinerary view, calendar view, and builder can all render from one fetch.

---

## 6. Tech stack

Pick what your team already knows. If you're genuinely undecided:

| Layer | Pick | Reasoning |
|---|---|---|
| Frontend | React + Vite + Tailwind | Fastest iteration, everyone knows it |
| Charts | Recharts | Pie + bar for budget in ~20 lines |
| Calendar | Hand-rolled CSS grid, or `react-big-calendar` | Don't overthink; a styled list with date headers reads fine |
| Backend | Node + Express, or FastAPI | Whichever your team is faster in |
| DB | **PostgreSQL** (Supabase/Neon free tier) | Brief demands relational. Managed = no local setup pain. |
| ORM | Prisma / SQLAlchemy | Prisma's schema file doubles as your ERD diagram for the pitch |
| Auth | Supabase Auth or Lucia | Rolling your own auth burns 4 hours you don't have |
| Deploy | Vercel (FE) + Railway/Render (BE) | Deploy in hour 3, not hour 23 |

**Deploy something on day one.** A live URL that shows "Hello World" beats a perfect localhost app that won't start during judging. Deployment always breaks in ways you can't predict; find out early.

---

## 7. Suggested timeline (24h format — compress or stretch to fit)

| Hours | Focus | Done when |
|---|---|---|
| 0–2 | Schema finalized, repo + deploy pipeline live, seed data written | `GET /cities?q=par` returns Paris in production |
| 2–5 | Auth + trip CRUD + My Trips list | You can sign up and see an empty trip list |
| 5–11 | **Itinerary Builder** (add/edit/reorder stops, attach activities) | A 2-city trip with 5 activities exists in the DB |
| 11–14 | Budget calculation + breakdown charts | Numbers change when you add an activity |
| 14–17 | Itinerary View + calendar toggle | The trip looks like a real plan |
| 17–19 | Public share link | Incognito window renders the trip |
| 19–21 | **Freeze features.** Styling, empty states, mobile responsiveness | Nothing looks broken on a phone |
| 21–23 | Seed a beautiful demo trip, rehearse the pitch 3× | You can do the run-through in 3 min without touching code |
| 23–24 | Buffer for the thing that breaks | It will |

That hour-19 feature freeze is the most important row in this table. Teams that keep adding features until the deadline demo a broken app.

---

## 8. Where teams lose points on this brief

1. **Budget is a text input.** If a judge can type "5000" into a total-cost field, you've failed the core requirement. It must be derived.
2. **Reordering cities corrupts the dates.** Decide now: does reordering shift dates automatically, or keep them fixed? Either is defensible — inconsistency isn't.
3. **Empty database at demo time.** Seed data, seeded early.
4. **The share link needs a login.** Test in incognito. Every time.
5. **No mobile check.** The brief says "desktop or mobile." A judge will pull it up on a phone. Ten minutes of responsive fixes protects hours of work.
6. **Overlapping stop dates.** Paris May 1–5 and Rome May 3–8 should warn the user. A simple validation here reads as real product thinking.
7. **The pitch is a feature tour.** Don't list screens. Tell the trip-planning story and let the screens appear inside it.

---

## 9. The three-minute demo script

1. **(20s) Problem.** "Planning a multi-city trip means eight browser tabs and a spreadsheet that's wrong by day three."
2. **(30s) Sign in, land on dashboard.** Show an existing trip. Move fast here.
3. **(60s) Build.** Create "Europe Summer 2026." Add Paris. Search activities, add the Louvre and a food tour. Add Rome. **Drag Rome above Paris** — show it reorder cleanly. This is the moment that proves your data model.
4. **(30s) Budget.** Open the breakdown. Add one more activity. Let them watch the pie chart move. Say the sentence: *"This is a single join across four tables — nothing here is hardcoded."*
5. **(20s) Calendar view.** Toggle. Let it speak for itself.
6. **(20s) Share.** Generate the link, open it on your phone, hand the phone to a judge.
7. **(20s) Close.** One line on the schema, one line on what's next.

Rehearse it three times. Record a 90-second backup video in case the wifi dies — this has saved more hackathon teams than any feature ever has.

---

## 10. If you want one differentiating idea

Everything above gets you a solid, complete submission. If you want something that makes judges remember you, add exactly **one** small smart feature — not three:

- **Budget health bar.** User sets a target budget at trip creation. A persistent bar shows spend against it, turning amber then red. Cheap to build, instantly legible, directly serves the brief's "stay within budget" language.
- **Cost-index suggestions.** "Rome is a 4/5 on cost index. Bologna is 2/5 and 40 minutes away." Uses a column you already have.
- **Auto-fill day gaps.** Detect a day in a stop with no activities and suggest two from that city's catalogue. Feels like intelligence, is actually a `WHERE` clause.

The budget health bar is the best value-for-effort of the three.

---

*Build the loop. Freeze early. Demo the story, not the feature list.*