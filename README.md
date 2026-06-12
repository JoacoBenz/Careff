# careff

Next.js App Router + TypeScript + Prisma/PostgreSQL + NextAuth + Zod + Vitest.

## Setup

```bash
cp .env.example .env.local   # fill in values
docker compose up -d db      # local PostgreSQL
npm install
npm run db:migrate           # apply schema
npm run db:seed              # seed admin user
npm run dev
```

## Scripts

`dev` · `build` · `start` · `lint` / `lint:fix` · `format` / `format:check` ·
`test` / `test:watch` / `test:coverage` · `db:migrate` / `db:studio` / `db:seed`

## Conventions

See `AGENTS.md` (also loaded by `CLAUDE.md`) and `docs/architecture.md`.
Working examples: `/login`, `POST /api/auth/register`, `GET /api/me`, `GET /api/health`.
