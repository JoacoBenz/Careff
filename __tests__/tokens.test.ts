import { describe, it, expect } from 'vitest';
import { Prisma } from '@/generated/prisma/client';
import { createWithUniqueToken, generateToken } from '@/lib/tokens';

describe('generateToken', () => {
  it('produces distinct URL-safe tokens', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('createWithUniqueToken', () => {
  it('returns the created row on the first try', async () => {
    const row = await createWithUniqueToken(async (token) => ({ token }));
    expect(row.token).toBeTruthy();
  });

  it('retries with a fresh token on a P2002 collision', async () => {
    const tokens: string[] = [];
    let calls = 0;
    const row = await createWithUniqueToken(async (token) => {
      tokens.push(token);
      calls += 1;
      if (calls === 1) {
        throw new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'test',
        });
      }
      return { token };
    });
    expect(calls).toBe(2);
    expect(tokens[0]).not.toBe(tokens[1]);
    expect(row.token).toBe(tokens[1]);
  });

  it('rethrows non-collision errors immediately', async () => {
    let calls = 0;
    await expect(
      createWithUniqueToken(async () => {
        calls += 1;
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(calls).toBe(1);
  });
});
