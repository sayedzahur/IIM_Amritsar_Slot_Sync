# IIM Amritsar Campus Services Portal (Prototype)

A Next.js app covering the four booking workflows: cleaning staff slots,
laundry sequence registration, library conference room booking, and
post-hours classroom booking — each with a student-facing form and a
manager view to approve / mark complete.

Frontend and backend live in the same Next.js app: pages under `app/`,
API routes under `app/api/*/route.js` (these are the "JavaScript backend").
Data is stored in plain CSV files under `/data` instead of a database, as
requested for this prototype.

## 1. Run it locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The four student-facing modules are linked
from the home page; the manager dashboard is at `/manager`.

**Manager password (prototype only):** `iimamritsar2026`
Change it in `app/manager/page.js` (`MANAGER_PASSWORD`) before sharing
this with anyone. This is a client-side check only — fine for a demo,
**not secure enough for real use** (see "Known limitations" below).

## 2. How each module works

| Module | Slot type | Conflict rule | Manager action |
|---|---|---|---|
| Cleaning | Fixed 30-min slots, 8–12 & 1–4 | Same date + same slot already taken; today's already-passed slots are greyed out | Mark completed |
| Laundry | Auto-assigned sequence number | One active (non-completed) registration per Roll No. at a time | Mark completed (frees up the student to register again) |
| Library | Free-form from/to time, 24x7, Conference Room 1–2 | Overlapping time range for the same room + date; today's already-passed times are blocked | Approve / Reject (reason required on reject) |
| Classroom | Free-form from/to time, 24x7, Class Room 1–12 (Room 8 excluded) | Overlapping time range for the same room + date; today's already-passed times are blocked | Approve / Reject (reason required on reject) |

"Today" and "now" are always evaluated in IST (Asia/Kolkata), not the
server's local timezone — see `nowInIST()` in `lib/slots.js` — so this
behaves correctly however the hosting platform's clock is configured.

Each CSV file (`data/cleaning.csv`, `laundry.csv`, `library.csv`,
`classroom.csv`) is the full record set for that module — `id`, all the
input fields specified in the brief, a `status` column, and `bookedAt`
(timestamp). `lib/csvStore.js` handles the read/append/update ("CRUD")
logic; `lib/slots.js` handles slot generation and overlap checking.

## 3. Known limitations (it's a prototype)

- **Manager login is not real authentication** — it's a hardcoded
  password checked in the browser. Good enough to keep casual users out
  of the approval screen, not good enough for anything sensitive.
- **CSV is not concurrency-safe** — two bookings submitted at the exact
  same instant could theoretically race. Fine at hostel scale, not fine
  at real production scale (that's when you'd move to a database).
- **No email/SMS notifications** — students see status inline on the
  page; there's no alerting when a manager approves/rejects.
- **No cancellation flow for students** — only the manager can change a
  booking's status after the fact (a `status: "cancelled"` value is
  supported by the API if you want to wire up a cancel button later).

## 4. Hosting it so it's reachable via a URL

I looked into current (2026) free-hosting options — this space changes
fairly often, so treat the specifics below as "true as of when I
checked" and confirm current pricing/limits before you commit.

**The one thing that matters for this app specifically:** it writes to
CSV files on disk. That only works if the platform gives your app a
*persistent, writable filesystem*. A lot of "free" hosting today is
serverless (Vercel, Netlify, Cloudflare) — great for the Next.js pages
and API routes themselves, but the filesystem is read-only or wiped
between requests, so your bookings would vanish. Keep that in mind
whichever option you pick.

**Option A — Render, free web service (simplest, good for a demo/review link)**
1. Push this project to a GitHub repo.
2. On Render, create a new **Web Service**, connect the repo, build
   command `npm install && npm run build`, start command `npm start`.
3. You get a free `https://your-app.onrender.com` URL.
4. Caveats: free services spin down after ~15 minutes of no traffic
   (first request after that takes a bit to wake up), and **free
   services can't attach a persistent disk** — so CSV writes only
   survive while the same container instance is alive. A redeploy or a
   long idle period can reset your data. Fine for demoing the flow to
   your IT panel; not fine for real bookings.

**Option B — Render (or Railway/Fly.io) on a small paid tier with a
persistent disk**
If you want bookings to actually survive over time, the cleanest fix
is a low-cost plan (roughly $5–7/month on Render or Railway) with a
persistent disk mounted at `/data`, so the CSV files stick around
across restarts and redeploys. This is the smallest change from what's
already built here.

**Option C — Keep the free serverless hosting, swap CSV for a free
hosted database**
Deploy the Next.js app on Vercel's free tier (excellent Next.js
support, generous limits) and replace `lib/csvStore.js` with calls to
a free-tier managed Postgres database — **Neon** and **Supabase** both
currently offer permanent (not trial) free tiers with no credit card
required, small storage caps, and compute that pauses when idle. This
is more setup work now but is the more durable path if this portal is
going to keep running past the review.

**My recommendation for now:** ship on Render's free tier (Option A) to
get a live URL for your interview/demo quickly, and if the institute
actually wants to run this, move to Option B or C before real students
start booking against it.

## 5. Project structure

```
app/
  layout.js, globals.css      — shared layout, IIM Amritsar–themed styling
  page.js                     — home page
  cleaning/page.js            — cleaning slot booking (student view)
  laundry/page.js             — laundry sequence registration (student view)
  library/page.js             — conference room booking (student view)
  classroom/page.js           — classroom booking (student view)
  manager/page.js             — manager login + approve/complete dashboard
  api/cleaning/route.js       — GET/POST/PATCH for cleaning bookings
  api/laundry/route.js        — GET/POST/PATCH for laundry registrations
  api/library/route.js        — GET/POST/PATCH for conference room bookings
  api/classroom/route.js      — GET/POST/PATCH for classroom bookings
lib/
  csvStore.js                 — CSV read/append/update helpers
  slots.js                    — slot generation + time-overlap checks
data/
  *.csv                       — the "database" (seeded with headers only)
public/
  logo.png                    — IIM Amritsar logo
```
