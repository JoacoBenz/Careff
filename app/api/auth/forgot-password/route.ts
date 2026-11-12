import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validators';
import { withOptionalAuth, withValidation, type OptionalAuthContext } from '@/lib/api-handler';
import { enforceRateLimit, rateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/account-emails';
import { logApiError } from '@/lib/logger';

// Public endpoint: emails a single-use reset link. Always answers 200 with the
// same body, whether or not the address has an account, so it can't be used to
// probe who is registered.
export const POST = withOptionalAuth(
  withValidation<ForgotPasswordInput, OptionalAuthContext>(
    forgotPasswordSchema,
    async (request, { data }) => {
      const limited = enforceRateLimit(request, 'forgot-password', {
        limit: 5,
        windowMs: 900_000,
      });
      if (limited) return limited;

      const user = await prisma.user.findFirst({
        where: { email: { equals: data.email, mode: 'insensitive' } },
        select: { id: true, email: true, name: true },
      });

      // Cap mails per account too, so nobody can flood someone else's inbox
      // from many addresses. Over the cap we silently skip sending.
      if (user && rateLimit(`forgot-user:${user.id}`, { limit: 3, windowMs: 3_600_000 }).ok) {
        try {
          await sendPasswordResetEmail(user);
        } catch (error) {
          logApiError('/api/auth/forgot-password#send', 'POST', error);
        }
      }

      return Response.json({ ok: true });
    },
  ),
);
