import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Match Next.js env loading: .env.local wins, .env is the fallback. Without
// this the Prisma CLI only sees .env and `migrate deploy` fails for setups
// that follow the README (.env.local only).
config({ path: '.env.local' });
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
});
