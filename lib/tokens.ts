import { randomBytes } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client';

/** Unguessable URL-safe token (72 bits by default) for share/invite links. */
export function generateToken(bytes = 9): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Creates a row whose token must be unique, retrying with a fresh token if the
 * insert hits a unique-constraint violation (P2002). Collisions are
 * astronomically rare at 72 bits, but this turns the theoretical case into a
 * retry instead of an unhandled 500.
 */
export async function createWithUniqueToken<T>(
  create: (token: string) => Promise<T>,
  attempts = 5,
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await create(generateToken());
    } catch (error) {
      const isCollision =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (isCollision && i < attempts - 1) continue;
      throw error;
    }
  }
  // Unreachable: the loop either returns or throws on the last attempt.
  throw new Error('createWithUniqueToken: exhausted attempts');
}
