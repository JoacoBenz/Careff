# careff — architecture

Full-stack monolith on Next.js App Router: one deployable serving both UI and API.

## Layout

| Path          | Responsibility                                                       |
| ------------- | -------------------------------------------------------------------- |
| `app/`        | Routes, pages and API route handlers                                 |
| `app/api/`    | REST endpoints (`route.ts` files)                                    |
| `components/` | Reusable UI components (PascalCase files)                            |
| `hooks/`      | Shared React hooks                                                   |
| `lib/`        | Domain logic, integrations, shared infrastructure (kebab-case files) |
| `types/`      | Shared TypeScript types                                              |
| `prisma/`     | Database schema, migrations, seeds                                   |
| `__tests__/`  | Vitest suites mirroring `lib/` and `app/api/`                        |
| `scripts/`    | Operational one-off scripts                                          |
| `docs/`       | Playbooks and architecture notes                                     |

## Growth path

When distinct business domains accumulate, introduce `src/modules/<domain>/`
(each with its own `services/` and `validators/`) plus `src/core/` for
cross-cutting platform concerns and `src/shared/` for cross-domain utilities —
the modular-monolith layout. Split into separate services only when deployment
or scaling pressure demands it.

## Request flow

```
request → proxy/middleware (auth redirects)
        → app/api/<route>/route.ts
        → withAuth (session) → withValidation (Zod)
        → domain logic in lib/ → Prisma → PostgreSQL
        → uniform JSON response | logApiError on failure
```
