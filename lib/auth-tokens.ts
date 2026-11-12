import { createHash } from 'node:crypto';
import type { AuthTokenType } from '@/generated/prisma/client';
import { prisma } from './prisma';
import { generateToken } from './tokens';

/**
 * Single-use tokens for emailed links (password reset, email verification).
 * The raw token only ever lives in the email; the database stores its SHA-256.
 */

export const AUTH_TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24 hours
};

export function hashAuthToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Issues a fresh token for the user, replacing any earlier one of the same
 * type (only the latest emailed link works). Returns the raw token.
 */
export async function issueAuthToken(userId: number, type: AuthTokenType): Promise<string> {
  const token = generateToken(32);
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type } }),
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hashAuthToken(token),
        expiresAt: new Date(Date.now() + AUTH_TOKEN_TTL_MS[type]),
      },
    }),
  ]);
  return token;
}

/**
 * Validates and burns a token. Returns the owning user id, or null when the
 * token is unknown, of another type, expired, or already used.
 */
export async function consumeAuthToken(token: string, type: AuthTokenType): Promise<number | null> {
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hashAuthToken(token) } });
  if (!row || row.type !== type) return null;
  // deleteMany (not delete) so two concurrent uses can't both succeed: only
  // the request that actually removes the row gets count === 1.
  const { count } = await prisma.authToken.deleteMany({ where: { id: row.id } });
  if (count !== 1) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  return row.userId;
}
