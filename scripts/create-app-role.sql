-- Least-privilege application role for production.
--
-- The app (DATABASE_URL) should NOT connect as a superuser: a superuser
-- bypasses table grants and row-level security, so any SQL-injection or
-- dependency bug would inherit full database power. Run this script ONCE
-- against the production database, connected as the role that owns the schema
-- (the same role that runs `prisma migrate deploy`):
--
--   psql "$OWNER_DATABASE_URL" -f scripts/create-app-role.sql
--
-- Then point the app's DATABASE_URL at careff_app. Keep DIRECT_URL on the
-- owner role — migrations still need DDL rights. Replace the placeholder
-- password before running (or ALTER ROLE ... PASSWORD afterwards).

CREATE ROLE careff_app LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

GRANT USAGE ON SCHEMA public TO careff_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO careff_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO careff_app;

-- Tables created by FUTURE migrations (run by the owner) get the same grants
-- automatically. This only holds if the script is executed BY the owner role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO careff_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO careff_app;

-- careff_app owns nothing, has no DDL rights, and is subject to row-level
-- security — which makes RLS policies a viable second defense layer later.
