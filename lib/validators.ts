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
