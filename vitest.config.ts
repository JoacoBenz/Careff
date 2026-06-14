import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    // Domain/lib modules import lib/env; skip its strict validation under test.
    env: { SKIP_ENV_VALIDATION: 'true' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Cover the unit-testable domain core. Framework-coupled glue (auth,
      // prisma, env, logger) and the API route handlers need integration/e2e
      // coverage, which is out of scope for these unit suites.
      include: ['lib/**/*.ts'],
      exclude: ['lib/auth.ts', 'lib/prisma.ts', 'lib/env.ts', 'lib/logger.ts'],
      thresholds: { statements: 75, branches: 60, functions: 75, lines: 75 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
