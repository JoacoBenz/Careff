import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema, type RegisterInput } from '@/lib/validators';
import {
  apiError,
  withOptionalAuth,
  withValidation,
  type OptionalAuthContext,
} from '@/lib/api-handler';
import { enforceRateLimit } from '@/lib/rate-limit';

// Public endpoint: creates an account. Composes the standard wrappers
// (withOptionalAuth + withValidation) for uniform JSON parsing, validation and
// error handling — no hand-rolled try/catch.
export const POST = withOptionalAuth(
  withValidation<RegisterInput, OptionalAuthContext>(registerSchema, async (request, { data }) => {
    const limited = enforceRateLimit(request, 'register', { limit: 10, windowMs: 900_000 });
    if (limited) return limited;

    const { email, name, password } = data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError('EMAIL_TAKEN', 'Ya existe una cuenta con ese email', 409);
    }
    const user = await prisma.user.create({
      data: { email, name, passwordHash: await bcrypt.hash(password, 10) },
    });
    return Response.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  }),
);
