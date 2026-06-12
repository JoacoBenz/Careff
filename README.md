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

## Why it's free to run

- **Geocoding**: [Nominatim](https://nominatim.org) public instance (OpenStreetMap) — no API key.
- **Driving distances**: [OSRM](http://project-osrm.org) public demo server — one
  `table` call per plan returns the full distance matrix.
- **Navigation links**: Google Maps deep links (`/maps/dir/?api=1`) — free, no key.
- **Hosting**: deploys on Vercel's free tier; PostgreSQL on Neon/Supabase free tier.

Request caps in `lib/validators.ts` (≤10 drivers, ≤30 passengers) plus a geocode
cache keep usage within the public instances' fair-use policies. For heavier
traffic, point `NOMINATIM_URL` / `OSRM_URL` at self-hosted instances.

## Stack

Next.js App Router + TypeScript + Prisma/PostgreSQL + NextAuth + Zod + Vitest.

| Piece              | Where                                                    |
| ------------------ | -------------------------------------------------------- |
| Planning algorithm | `lib/carpool.ts` (pure, distance function injected)      |
| Geo providers      | `lib/geo.ts` (Nominatim + OSRM, swappable via env)       |
| API                | `POST /api/carpool` (compute + save), `GET /api/carpool` |
| UI                 | `/planner` (build a plan), `/plans` (saved plans)        |
| Auth               | `/login`, `/register`, NextAuth credentials + JWT        |

## Setup

```bash
cp .env.example .env.local   # fill in values
docker compose up -d db      # local PostgreSQL
npm install
npm run db:migrate           # apply schema
npm run db:seed              # seed admin user
npm run dev
```

## Deploying for free

1. Create a free PostgreSQL database (Neon or Supabase) and copy the connection string.
2. Import the repo in Vercel; set `DATABASE_URL`, `NEXTAUTH_URL` (your deployment URL)
   and `NEXTAUTH_SECRET` (`openssl rand -base64 32`).
3. Run `npx prisma migrate deploy` against the database.

## Scripts

`dev` · `build` · `start` · `lint` / `lint:fix` · `format` / `format:check` ·
`test` / `test:watch` / `test:coverage` · `db:migrate` / `db:studio` / `db:seed`

## Conventions

See `AGENTS.md` (also loaded by `CLAUDE.md`) and `docs/architecture.md`.
