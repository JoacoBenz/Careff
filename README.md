# Careff

Free carpool planner SaaS. Enter who has a car (and how many free seats), who needs
a ride, and the final destination — Careff assigns every passenger to the nearest
driver with room, orders each driver's pickups, and produces a per-car route with
distances and a Google Maps link.

Ported from the original _MartinaAutos_ Python (PyQt5/Flask) prototype to a
production web app.

Built to convert: **guest mode** (compute a plan with no account — registering is
only needed to save), **address autocomplete** while typing, **per-driver WhatsApp
share** with the route prefilled, and **public share links** (`/p/<token>`) so the
whole group can see the plan.

## Launch polish (v1.0)

- **WhatsApp/social link previews**: site-wide OpenGraph/Twitter cards with a
  branded image generated at request time (`app/opengraph-image.tsx`), and
  **per-plan cards** on share links — `/p/<token>` previews show the plan title
  and destination.
- **SEO hygiene**: `robots.txt` indexes only `/`, `/planner`, `/login`,
  `/register`; secret-token pages (`/p/`, `/join/`) and the API are excluded,
  plus `sitemap.xml` for the public pages.
- **Brand favicon** (`app/icon.svg`) and a **web manifest** (add to home screen
  with dark splash), themed **404** page.

## Why it's free to run

- **Geocoding**: [Georef](https://datosgobar.github.io/georef-api-docs/) (Argentine
  government geocoder) is the primary, house-number-precise source for AR addresses,
  scoped by province to avoid same-named streets;
  [Nominatim](https://nominatim.org) (OpenStreetMap) is the fallback for POIs and
  addresses outside Argentina. No API key for either.
- **Driving distances**: [OSRM](http://project-osrm.org) public demo server — one
  `table` call per plan returns the full distance matrix.
- **Navigation links**: Google Maps deep links (`/maps/dir/?api=1`) with `lat,lng`
  coordinates — free, no key.
- **Fuel prices** (optional): the Secretaría de Energía open dataset suggests a
  current Nafta Súper price for the trip-expense estimator (best-effort, editable).
- **Hosting**: deploys on Vercel's free tier; PostgreSQL on Neon/Supabase free tier.

Request caps in `lib/validators.ts` (≤10 drivers, ≤30 passengers) plus a geocode
cache keep usage within the public instances' fair-use policies. For heavier
traffic, point `GEOREF_URL` / `NOMINATIM_URL` / `OSRM_URL` at self-hosted instances.

## Stack

Next.js App Router + TypeScript + Prisma/PostgreSQL + NextAuth + Zod + Vitest.

| Piece              | Where                                                       |
| ------------------ | ----------------------------------------------------------- |
| Planning algorithm | `lib/carpool.ts` (pure, distance function injected)         |
| Geo providers      | `lib/geo.ts` (Georef + Nominatim + OSRM, swappable via env) |
| API                | `POST /api/carpool` (compute + save), `GET /api/carpool`    |
| UI                 | `/planner` (build a plan), `/plans` (saved plans)           |
| Auth               | `/login`, `/register`, NextAuth credentials + JWT           |

## Setup

```bash
cp .env.example .env.local   # fill in values (Windows: copy .env.example .env.local)
docker compose up -d db      # local PostgreSQL
npm install                  # also generates the Prisma client (postinstall)
npx prisma migrate deploy    # apply schema
npm run db:seed              # optional: seed admin user
npm run dev
```

## Deploying for free

1. Create a free PostgreSQL database (Neon or Supabase) and copy the connection string.
2. Import the repo in Vercel; set `DATABASE_URL`, `NEXTAUTH_URL` (your deployment URL)
   and `NEXTAUTH_SECRET` (`openssl rand -base64 32`).
3. Set `NEXT_PUBLIC_APP_URL` to the same deployment URL — it drives the OpenGraph
   previews (WhatsApp link cards), `sitemap.xml` and `robots.txt`.
4. Run `npx prisma migrate deploy` against the database.
5. Create the least-privilege app role (`scripts/create-app-role.sql`, run as the
   database owner) and point `DATABASE_URL` at `careff_app`; keep `DIRECT_URL` on
   the owner role for migrations. Don't run production as a superuser.

## Security notes

- **Tenant isolation is enforced in application code**: every read/write is
  scoped by the session user (plans by `userId`, groups by `ownerId`, ownership
  re-checked before destructive actions). Public routes (`/p/<token>`,
  `/join/<token>`) are token-gated with 72-bit random tokens and never accept ids.
- **Login hardening**: attempts are timing-equalized (a dummy bcrypt compare runs
  even when the email doesn't exist) and rate-limited — 10 attempts / 15 min per
  account plus 30 / 15 min per source IP; a blocked attempt looks exactly like
  bad credentials. Registration is rate-limited too (10 / 15 min per IP). The
  limiter is per-process (`lib/rate-limit.ts`) — swap in a shared store if you
  scale horizontally.
- **Known tradeoff**: register returns `EMAIL_TAKEN` (409). That's deliberate —
  without an email-verification flow a generic response would make legitimate
  signups undebuggable; the rate limit keeps enumeration at scale impractical.
- **Database role**: run production with `careff_app` (see
  `scripts/create-app-role.sql`), never a superuser. That role is also the
  prerequisite for enabling PostgreSQL RLS as a second defense layer later.

## Scripts

`dev` · `build` · `start` · `lint` / `lint:fix` · `typecheck` · `format` /
`format:check` · `test` / `test:watch` / `test:coverage` · `db:migrate` /
`db:studio` / `db:seed`

## Conventions

See `AGENTS.md` (also loaded by `CLAUDE.md`) and `docs/architecture.md`.
