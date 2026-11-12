import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory stand-in for the auth_tokens table.
interface Row {
  id: number;
  userId: number;
  type: string;
  tokenHash: string;
  expiresAt: Date;
}

const db = vi.hoisted(() => ({ rows: [] as Row[], nextId: 1 }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    authToken: {
      deleteMany: vi.fn(async ({ where }: { where: Partial<Row> }) => {
        const before = db.rows.length;
        db.rows = db.rows.filter(
          (r) =>
            !(
              (where.id === undefined || r.id === where.id) &&
              (where.userId === undefined || r.userId === where.userId) &&
              (where.type === undefined || r.type === where.type)
            ),
        );
        return { count: before - db.rows.length };
      }),
      create: vi.fn(async ({ data }: { data: Omit<Row, 'id'> }) => {
        const row = { id: db.nextId++, ...data };
        db.rows.push(row);
        return row;
      }),
      findUnique: vi.fn(
        async ({ where }: { where: { tokenHash: string } }) =>
          db.rows.find((r) => r.tokenHash === where.tokenHash) ?? null,
      ),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

import {
  AUTH_TOKEN_TTL_MS,
  consumeAuthToken,
  hashAuthToken,
  issueAuthToken,
} from '@/lib/auth-tokens';

beforeEach(() => {
  db.rows = [];
  db.nextId = 1;
  vi.useRealTimers();
});

describe('issueAuthToken', () => {
  it('stores only the hash, never the raw token', async () => {
    const token = await issueAuthToken(7, 'PASSWORD_RESET');
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].tokenHash).toBe(hashAuthToken(token));
    expect(db.rows[0].tokenHash).not.toContain(token);
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it('replaces an earlier token of the same type but keeps other types', async () => {
    const first = await issueAuthToken(7, 'PASSWORD_RESET');
    const verify = await issueAuthToken(7, 'EMAIL_VERIFY');
    const second = await issueAuthToken(7, 'PASSWORD_RESET');

    expect(await consumeAuthToken(first, 'PASSWORD_RESET')).toBeNull();
    expect(await consumeAuthToken(second, 'PASSWORD_RESET')).toBe(7);
    expect(await consumeAuthToken(verify, 'EMAIL_VERIFY')).toBe(7);
  });
});

describe('consumeAuthToken', () => {
  it('works exactly once', async () => {
    const token = await issueAuthToken(3, 'EMAIL_VERIFY');
    expect(await consumeAuthToken(token, 'EMAIL_VERIFY')).toBe(3);
    expect(await consumeAuthToken(token, 'EMAIL_VERIFY')).toBeNull();
  });

  it('rejects unknown tokens', async () => {
    expect(await consumeAuthToken('nope-nope-nope-nope', 'PASSWORD_RESET')).toBeNull();
  });

  it('rejects a token used for the wrong purpose, without burning it', async () => {
    const token = await issueAuthToken(3, 'EMAIL_VERIFY');
    expect(await consumeAuthToken(token, 'PASSWORD_RESET')).toBeNull();
    expect(await consumeAuthToken(token, 'EMAIL_VERIFY')).toBe(3);
  });

  it('rejects an expired token', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const token = await issueAuthToken(3, 'PASSWORD_RESET');
    vi.setSystemTime(Date.now() + AUTH_TOKEN_TTL_MS.PASSWORD_RESET + 1);
    expect(await consumeAuthToken(token, 'PASSWORD_RESET')).toBeNull();
  });
});
