import { prisma } from '@/lib/prisma';
import { apiError, withAuth } from '@/lib/api-handler';
import { rateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/account-emails';

// Re-sends the confirmation link to the logged-in user's own address.
export const POST = withAuth(async (_request, { session }) => {
  const userId = Number(session.user.id);

  if (!rateLimit(`verify-resend:${userId}`, { limit: 3, windowMs: 3_600_000 }).ok) {
    return apiError(
      'RATE_LIMITED',
      'Ya te mandamos varios emails. Revisá tu casilla (y el spam) o probá más tarde.',
      429,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (!user) return apiError('UNAUTHORIZED', 'Sesión expirada. Iniciá sesión nuevamente.', 401);
  if (user.emailVerified) return Response.json({ ok: true, alreadyVerified: true });

  await sendVerificationEmail(user);
  return Response.json({ ok: true });
});
