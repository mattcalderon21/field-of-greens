# ⛳ The Field of Greens

> *"If you pick him, points will come."*

A full-stack web application for tracking a **One-and-Done (OND) PGA Tour golf contest** among a friend group in Iowa and Nebraska. Built with Next.js 14, Tailwind CSS, and Supabase.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + Google Fonts (Playfair Display, Inter, JetBrains Mono) |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| Deployment | Vercel |

---

## Contest Rules

1. Each contestant picks **1 golfer per tournament week** (2 for the Zurich Classic team event).
2. Once a golfer is used ("burned"), they **cannot be picked again** for the rest of the season.
3. Points = prize money earned by the selected golfer that week.
4. Picks must be submitted **before the golfer tees off** in Round 1.
5. Picks can be **updated** as long as the new golfer hasn't teed off yet.
6. Season: **Jan 15, 2026 → Aug 20, 2026** (Sony Open → BMW Championship). FedEx Finale excluded.
7. Highest aggregate earnings at season end wins.

---

## Setup

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- Vercel account (for deployment)

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd field-of-greens
npm install
```

### 3. Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Only needed for seed script
```

Find these in your Supabase dashboard → **Project Settings → API**.

### 4. Database Setup

#### a) Run the schema migration

In your Supabase dashboard, go to **SQL Editor** and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, indexes, and the auto-profile trigger.

#### b) Run the seed data

Still in the SQL Editor, run:

```
supabase/seed.sql
```

This populates all 36 tournaments, the full golfer pool (~110 golfers), and tournament fields for weeks 1–6 (with results) plus week 7 (active, Cognizant Classic).

#### c) Seed user accounts & historical picks

```bash
npm run seed:picks
```

This creates the 9 contestant accounts and the admin account via the Supabase Admin API, then inserts all historical picks for weeks 1–6.

**Default credentials (change after first login!):**
- Contestants: `FieldOfGreens2026!`
- Admin: `AdminPass2026!`

Email format: `{name}@fieldofgreens.local` (e.g., `ben@fieldofgreens.local`)

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Pages

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Landing page with leaderboard preview & rules | Public |
| `/leaderboard` | Full season standings | Public |
| `/results` | Pick-by-pick results grid | Public |
| `/schedule` | Full 2026 tournament schedule | Public |
| `/picks` | Submit / update weekly pick | Required |
| `/login` | Sign in | — |
| `/signup` | Self-register | — |
| `/admin` | Admin panel (tournaments, fields, results, users) | Admin only |

---

## Admin Panel

Sign in as `admin@fieldofgreens.local` and navigate to `/admin`.

**Tabs:**

- **Tournaments** — Edit purse/dates, toggle Active/Completed status
- **Fields** — Add golfers to a tournament field; set R1 tee times
- **Results** — Enter finish positions and earnings after a tournament ends (auto-updates all contestant picks)
- **Picks** — View all picks for any week; lock/unlock individual picks
- **Users** — View contestants, toggle admin status, view burned golfers

### Weekly Workflow

1. **Monday/Tuesday before the tournament:** Go to Admin → Fields, select the upcoming tournament, and add all golfers in the field with their Thursday R1 tee times.
2. **Thursday:** Picks lock automatically as each golfer's tee time passes. No admin action needed.
3. **Sunday/Monday after:** Go to Admin → Results, enter each golfer's finish position and earnings. Click **Save Results** — picks are updated and locked automatically.
4. **Mark tournament complete:** Admin → Tournaments → click "Mark Complete" for that week.
5. **Activate next week:** Admin → Tournaments → click "Set Active" for the upcoming tournament.

---

## Database Schema

```
profiles          — User accounts (extends auth.users)
tournaments       — 36 OND tournaments for 2026 season
golfers           — PGA Tour + LIV Golf player pool
tournament_fields — Which golfers are in each tournament field + tee times + results
picks             — Each contestant's weekly pick + earnings
```

**Views:**
- `v_leaderboard` — Aggregate earnings per contestant with rank
- `v_burned_golfers` — Which golfers each user has used

---

## Special Cases

| Case | Handling |
|------|---------|
| **Zurich Classic** (team event) | `max_picks_per_user = 2`; pick form shows 2 golfer slots |
| **Same-week tournaments** | Both appear on the picks page (e.g., Arnold Palmer + Puerto Rico Open) |
| **Major purses (TBD)** | `purse = NULL`, shown as "TBD" in schedule; admin updates when announced |
| **No pick submitted** | Earnings = $0 for that week; shown as "—" in results grid |
| **Duplicate picks** | Multiple contestants can pick the same golfer in the same week |
| **LIV Golf players** | Included in golfer pool with `primary_tour = 'LIV Golf'` |

---

## Deployment to Vercel

1. Push your code to GitHub.
2. Create a new Vercel project and connect the repo.
3. Add environment variables in Vercel → Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Omit `SUPABASE_SERVICE_ROLE_KEY` — not needed at runtime)
4. Deploy. Vercel auto-detects Next.js.

**Note:** The `SUPABASE_SERVICE_ROLE_KEY` is only used by the seed script and should **never** be exposed to the browser or committed to version control.

---

## Future API Integration

The schema is structured to support automatic field/results population from APIs like SportsRadar or SportDevs:

- `tournament_fields.tee_time_r1` — maps to tee time data from API
- `tournament_fields.earnings` / `finish_position` — maps to results data from API
- `golfers.world_rank` — can be refreshed from world rankings feed

No schema changes are needed to add an API integration layer.

---

## Project Structure

```
field-of-greens/
├── app/
│   ├── admin/          — Admin panel (server + client components)
│   ├── api/auth/       — Supabase auth callback
│   ├── leaderboard/    — Season standings
│   ├── login/          — Sign-in page
│   ├── picks/          — Weekly pick submission
│   ├── results/        — Full results grid
│   ├── schedule/       — Tournament schedule
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx        — Landing page
├── components/
│   └── Navbar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts   — Browser Supabase client
│   │   └── server.ts   — Server Supabase client
│   ├── types.ts
│   └── utils.ts
├── scripts/
│   └── seed-picks.ts   — Creates users + historical picks
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── middleware.ts
└── ...config files
```

---

*Built for the Iowa/Nebraska friend group. 🌽⛳*
