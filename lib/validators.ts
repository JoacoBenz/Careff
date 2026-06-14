import { z } from 'zod';

/**
 * All input validation schemas live here. Every external input (request body,
 * query params, webhook payload) must be validated with one of these schemas
 * before it reaches Prisma or any domain logic.
 */

export const idSchema = z.coerce.number().int().positive();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const registerSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

const personNameSchema = z.string().min(1).max(80);
const addressSchema = z.string().min(3).max(200);

// Caps (10 drivers / 30 passengers) keep a single plan within the fair-use
// limits of the free geocoding/routing providers (see lib/geo.ts).
export const carpoolPlanSchema = z.object({
  title: z.string().min(1).max(120),
  city: z.string().max(120).optional(),
  destination: addressSchema,
  drivers: z
    .array(
      z.object({
        name: personNameSchema,
        address: addressSchema,
        capacity: z.coerce.number().int().min(1).max(8),
      }),
    )
    .min(1)
    .max(10),
  passengers: z
    .array(
      z.object({
        name: personNameSchema,
        address: addressSchema,
      }),
    )
    .min(1)
    .max(30),
  // Coordinates already resolved by autocomplete, keyed by the exact address
  // string. Addresses present here skip server-side geocoding (exact + fast).
  coords: z.record(z.string(), z.object({ lat: z.number(), lon: z.number() })).optional(),
  // Region for any address that still needs geocoding: country (ISO alpha-2)
  // scopes Nominatim; province (Georef id) kills same-named streets elsewhere.
  country: z.string().max(2).optional(),
  provincia: z.string().max(40).optional(),
});

export type CarpoolPlanInput = z.infer<typeof carpoolPlanSchema>;

export const geoSearchSchema = z.object({
  q: z.string().min(3).max(200),
  country: z.string().max(2).optional(),
  prov: z.string().max(40).optional(),
});

export const geoReverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// Province *name* (not Georef id) used to scope the fuel-price suggestion.
// Restricting the charset is defense-in-depth for lib/fuel.ts's dataset query.
export const fuelPriceQuerySchema = z.object({
  prov: z
    .string()
    .max(60)
    .regex(/^[\p{L}\p{M}\s.-]+$/u, 'provincia inválida')
    .optional(),
});

// Region defaults a registered user can save to their profile.
export const profileRegionSchema = z.object({
  country: z.string().max(2).optional(),
  provinceId: z.string().max(40).optional(),
  provinceName: z.string().max(80).optional(),
});

export type ProfileRegionInput = z.infer<typeof profileRegionSchema>;

export const createGroupSchema = z.object({
  name: z.string().min(1).max(80),
});

export const joinGroupSchema = z
  .object({
    token: z.string().min(8).max(64),
    name: personNameSchema,
    address: addressSchema,
    hasCar: z.boolean(),
    seats: z.coerce.number().int().min(0).max(8).default(0),
    // Coordinates from the autocomplete pick (skip re-geocoding at plan time).
    lat: z.number().optional(),
    lon: z.number().optional(),
  })
  .refine((data) => !data.hasCar || data.seats >= 1, {
    message: 'Si tenés auto, indicá al menos 1 asiento libre',
    path: ['seats'],
  });

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

// Shape of the remembered-profile cookie used to prefill the join form.
export const profileCookieSchema = z.object({
  name: z.string().max(80),
  address: z.string().max(200),
  hasCar: z.boolean(),
  seats: z.number().int().min(0).max(8),
});

export type ProfileCookie = z.infer<typeof profileCookieSchema>;
