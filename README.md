# NSHS Thespian Society Tracker

A web app for the school's Thespian Society troupe: students create an
account and log points toward the Thespian Induction Point System (TIPS),
and the teacher reviews/approves entries from an admin panel that also
manages the point catalog and rank ladder.

Built as a static single-page app (React + Vite + Tailwind CSS) backed by
[Supabase](https://supabase.com) for authentication and the database. The
built site is just static files, deployable to [Netlify](https://netlify.com)'s
free tier with a simple drag-and-drop upload — no command line required.

## Features

- **Home page** with a login link — no public application or officer
  roster, just a landing page pointing students to sign up.
- **Student login** — self-service sign-up and sign-in; every account can
  immediately start logging points.
- **Student dashboard** — log points against the TIPS catalog (One Act Show,
  Full Length Show, Officer, Festival/Event Attendance, Advocacy, Other),
  see a full point log, total approved points, and current induction rank
  with progress to the next rank.
- **Admin panel** (teacher-only, toggled via a simple `is_admin` flag):
  - **Members** — see every student, set graduation year, promote another
    account to admin if needed.
  - **Point Approval** — approve/reject submitted point entries, adjust
    bonus points.
  - **Point Catalog** — edit the point values for every role (or add new
    ones), deactivate roles without losing historical log entries.
  - **Rank Ladder** — edit the induction rank names and point thresholds.

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase Dashboard, go to **SQL Editor → New query**, paste the
   contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it.
   This creates all tables, the new-user trigger, Row Level Security
   policies, and seeds the point catalog + rank ladder with the published
   TIPS values (all editable later from the Admin Panel).
3. Go to **Project Settings → API** and copy the **Project URL** and
   **anon public key**.
4. (Optional but recommended) Under **Authentication → Providers → Email**,
   turn off "Confirm email" while testing — or leave it on and set the
   **Site URL** (Authentication → URL Configuration) to your real Netlify
   domain once you have one, so confirmation email links redirect correctly.
5. **Create your first admin**: sign up through the app once (see below),
   then in the Supabase Dashboard go to **Table Editor → profiles**, find
   your row, and set `is_admin` to `true`.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in the two values from step 1:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Visit the printed local URL. Sign up for an account, then set `is_admin` to
`true` on your profile in Supabase as described above to see the Admin Panel.

## 4. Build and deploy to Netlify

Build the static site:

```bash
npm run build
```

This produces a `dist/` folder containing `index.html`, hashed JS/CSS
bundles, and a `_redirects` file (needed so client-side page routes like
`/dashboard` load correctly).

**Easiest deploy — drag and drop, no account setup required to try it:**

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the `dist` folder onto the page.
3. Netlify gives you a live URL immediately (e.g. `random-name-123.netlify.app`).

**For a permanent site you can update over time**, create a free Netlify
account first, then either:
- Use the same drag-and-drop flow from your Netlify dashboard ("Deploys" tab
  → drag `dist` in) each time you rebuild, or
- Connect the site's GitHub repo under **Add a new site → Import an existing
  project**, and Netlify rebuilds automatically on every push (set the build
  command to `npm run build` and publish directory to `dist`, and add the
  two `VITE_SUPABASE_*` environment variables under **Site settings →
  Environment variables**).

Once deployed, you can rename the site (Site settings → Change site name) or
attach a custom domain later if the troupe gets one — neither requires
starting over.

## Project structure

```
src/
  components/   Navbar (with mobile hamburger menu), Footer, Layout,
                ProtectedRoute, StatusBadge
  context/      AuthContext (Supabase session + profile)
  lib/          Supabase client
  pages/        Home, Login, Dashboard
  pages/admin/  AdminPanel + Members/PointEntries/PointCatalog/RankLadder tabs
  types/        Database row types + the computeRank() helper
supabase/
  schema.sql    Tables, triggers, RLS policies, and TIPS seed data —
                run once in Supabase
```

## How the point system works

Each point log entry has a **category** (One Act Show, Full Length Show,
Officer, Festival/Event Attendance, Advocacy, Other):

- **One Act Show / Full Length Show**: the member picks a **role** from the
  point catalog (Acting-Major, Technical-Stage Crew, Directing-Choreographer,
  etc.) — each role carries two point values, one for One Act and a higher
  one for Full Length.
- **Officer**: the member picks an officer role (President, Treasurer,
  etc.), each with a flat point value.
- **Festival/Event Attendance, Advocacy, Other**: the member enters hours
  attended; points = hours × 0.1.

All of this — the role list, point values, and rank thresholds — is
editable from the Admin Panel without touching code, in case values need to
change from year to year.

## Customizing the color scheme

Blue/orange theme tokens live in `src/index.css` under the `@theme` block
(`--color-blue-*` / `--color-orange-*`).
