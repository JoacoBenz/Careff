import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators';
import {
  apiError,
  withOptionalAuth,
  withValidation,
  type OptionalAuthContext,
} from '@/lib/api-handler';
import { enforceRateLimit } from '@/lib/rate-limit';
import { consumeAuthToken } from '@/lib/auth-tokens';
import { logSecurityEvent } from '@/lib/logger';

// Public endpoint: exchanges a reset link's token for a new password.
export const POST = withOptionalAuth(
  withValidation<ResetPasswordInput, OptionalAuthContext>(
    resetPasswordSchema,
    async (request, { data }) => {
      const limited = enforceRateLimit(request, 'reset-password', {
        limit: 10,
        windowMs: 900_000,
      });
      if (limited) return limited;

      const userId = await consumeAuthToken(data.token, 'PASSWORD_RESET');
      if (!userId) {
        return apiError('INVALID_TOKEN', 'El link venció o ya fue usado. Pedí uno nuevo.', 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true },
      });
      if (!user) {
        return apiError('INVALID_TOKEN', 'El link venció o ya fue usado. Pedí uno nuevo.', 400);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: await bcrypt.hash(data.password, 10),
          // Opening the emailed link proves they own the address.
          emailVerified: user.emailVerified ?? new Date(),
        },
      });
      logSecurityEvent('password_reset', { userId });

      return Response.json({ ok: true });
    },
  ),
);
