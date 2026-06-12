# careff — agent conventions

## Stack

- Next.js (App Router) + React + TypeScript strict. Path alias `@/*`.
- Prisma + PostgreSQL (pg driver adapter). Schema in `prisma/schema.prisma`.
- NextAuth v5 (JWT sessions, credentials provider) in `lib/auth.ts`.
- Zod for ALL external input validation — schemas live in `lib/validators.ts`.
- Vitest (not Jest). Tests in `__tests__/`.
- Tailwind CSS v4 via PostCSS.

## Patterns

- **API routes** compose `withAuth` / `withValidation` from `lib/api-handler.ts` —
  never hand-roll auth, validation or error handling in a route.
- **Errors**: `logApiError()` from `lib/logger.ts` (structured JSON). Uniform error
  body: `{ error: { code, message } }`.
- **Raw SQL** only via parameterized `$queryRaw` template tags.
- **Prisma client** is the singleton from `lib/prisma.ts` — never instantiate ad hoc.
- **Env vars**: add to `.env.example` AND `lib/env.ts` schema in the same change.

## Antipatterns

- Empty `catch {}` blocks (lint error).
- `any` in API routes — use generated Prisma types.
- `'use client'` on pages that can stay server components.
- New `console.log` calls — only `warn`/`error` are allowed; use the logger.

## Workflow

- Branches: `feature/...`, `fix/...`, `chore/...`. Never commit directly to main.
- Conventional commits.
- Pre-commit (husky) runs lint-staged: eslint --fix + prettier.
- CI blocks: lint errors, format:check, failing tests, broken build.

## Frequent tasks

- **New endpoint**: `app/api/<route>/route.ts` using `withAuth`; add schema to
  `lib/validators.ts`; add a test in `__tests__/api/`. Working examples:
  `app/api/me/route.ts` (protected), `app/api/auth/register/route.ts` (public).
- **New page**: server component by default; `app/(auth)/login/page.tsx` shows the
  client-component pattern.
- **New model**: edit `prisma/schema.prisma`, `npm run db:migrate -- --name <desc>`.
- **New test**: `__tests__/<name>.test.ts` following existing patterns.
