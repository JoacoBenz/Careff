import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Non-pooled connection used by Prisma migrations (see prisma.config.ts).
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().min(1, 'NEXTAUTH_URL is required'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SENTRY_DSN: z.string().optional(),
  // Public (build-time inlined) vars — validated so a typo is caught early.
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  // Mission Control (optional): when both are set, lib/logger.ts ships warn/error
  // entries to the dashboard's /api/ingest. The health endpoint needs nothing.
  MISSION_CONTROL_URL: z.string().url().optional(),
  MISSION_CONTROL_API_KEY: z.string().optional(),
  NOMINATIM_URL: z.string().url().default('https://nominatim.openstreetmap.org'),
  OSRM_URL: z.string().url().default('https://router.project-osrm.org'),
  // Argentine government geocoder (free, no key). Primary for AR addresses;
  // Nominatim is the fallback for POIs / addresses outside Argentina.
  GEOREF_URL: z.string().url().default('https://apis.datos.gob.ar/georef/api'),
  // Secretaría de Energía open data (free, no key) for suggesting fuel prices.
  // The resource id changes when the dataset is republished — override it via
  // env to keep the auto-suggest working without a code change.
  ENERGIA_API_URL: z.string().url().default('https://datos.energia.gob.ar/api/3/action'),
  ENERGIA_FUEL_RESOURCE: z.string().default('80ac25de-a44a-4445-9215-090cf55cfda5'),
});

function validateEnv() {
  if (process.env.SKIP_ENV_VALIDATION === 'true' || process.env.SKIP_ENV_VALIDATION === '1') {
    return process.env as unknown as z.infer<typeof envSchema>;
  }
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`\nInvalid environment variables:\n${formatted}\n`);
    throw new Error('Invalid environment variables');
  }
  return result.data;
}

export const env = validateEnv();
