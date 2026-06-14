import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_URL: z.string().min(1, 'NEXTAUTH_URL is required'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SENTRY_DSN: z.string().optional(),
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
