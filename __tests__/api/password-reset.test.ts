import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => null) }));
vi.mock('@/lib/logger', () => ({ logApiError: vi.fn(), logSecurityEvent: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock('@/lib/account-emails', () => ({ sendPasswordResetEmail: vi.fn() }));
vi.mock('@/lib/auth-tokens', () => ({ consumeAuthToken: vi.fn() }));

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/account-emails';
import { consumeAuthToken } from '@/lib/auth-tokens';
import { _resetRateLimits } from '@/lib/rate-limit';
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';

const findFirst = prisma.user.findFirst as unknown as Mock;
const findUnique = prisma.user.findUnique as unknown as Mock;
const update = prisma.user.update as unknown as Mock;
const sendReset = sendPasswordResetEmail as unknown as Mock;
const consume = consumeAuthToken as unknown as Mock;

function post(path: string, body: unknown, ip = '10.0.0.1'): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

const user = { id: 5, email: 'ana@example.com', name: 'Ana' };

beforeEach(() => {
  vi.clearAllMocks();
  _resetRateLimits();
});

describe('POST /api/auth/forgot-password', () => {
  it('emails a reset link when the account exists', async () => {
    findFirst.mockResolvedValue(user);
    const res = await forgotPassword(post('/api/auth/forgot-password', { email: user.email }));
    expect(res.status).toBe(200);
    expect(sendReset).toHaveBeenCalledWith(user);
  });

  it('answers the same way when the account does not exist', async () => {
    findFirst.mockResolvedValue(null);
    const res = await forgotPassword(post('/api/auth/forgot-password', { email: 'x@example.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendReset).not.toHaveBeenCalled();
  });

  it('still answers 200 when the mail provider fails', async () => {
    findFirst.mockResolvedValue(user);
    sendReset.mockRejectedValueOnce(new Error('resend down'));
    const res = await forgotPassword(post('/api/auth/forgot-password', { email: user.email }));
    expect(res.status).toBe(200);
  });

  it('stops mailing one account after 3 requests, even from different addresses', async () => {
    findFirst.mockResolvedValue(user);
    for (let i = 0; i < 5; i++) {
      const res = await forgotPassword(
        post('/api/auth/forgot-password', { email: user.email }, `10.0.1.${i}`),
      );
      expect(res.status).toBe(200);
    }
    expect(sendReset).toHaveBeenCalledTimes(3);
  });

  it('rate-limits one address', async () => {
    findFirst.mockResolvedValue(null);
    let last = 200;
    for (let i = 0; i < 6; i++) {
      last = (await forgotPassword(post('/api/auth/forgot-password', { email: 'a@b.co' }))).status;
    }
    expect(last).toBe(429);
  });

  it('rejects a malformed email', async () => {
    const res = await forgotPassword(post('/api/auth/forgot-password', { email: 'nope' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  const token = 'a'.repeat(43);

  it('sets the new password and marks the email verified', async () => {
    consume.mockResolvedValue(5);
    findUnique.mockResolvedValue({ emailVerified: null });
    const res = await resetPassword(
      post('/api/auth/reset-password', { token, password: 'nueva-clave-123' }),
    );
    expect(res.status).toBe(200);
    expect(consume).toHaveBeenCalledWith(token, 'PASSWORD_RESET');

    const args = update.mock.calls[0][0] as {
      where: { id: number };
      data: { passwordHash: string; emailVerified: Date };
    };
    expect(args.where).toEqual({ id: 5 });
    expect(await bcrypt.compare('nueva-clave-123', args.data.passwordHash)).toBe(true);
    expect(args.data.emailVerified).toBeInstanceOf(Date);
  });

  it('keeps the original verification date', async () => {
    const verifiedAt = new Date('2026-01-01T00:00:00Z');
    consume.mockResolvedValue(5);
    findUnique.mockResolvedValue({ emailVerified: verifiedAt });
    await resetPassword(post('/api/auth/reset-password', { token, password: 'nueva-clave-123' }));
    const args = update.mock.calls[0][0] as { data: { emailVerified: Date } };
    expect(args.data.emailVerified).toBe(verifiedAt);
  });

  it('refuses an invalid, expired or reused link', async () => {
    consume.mockResolvedValue(null);
    const res = await resetPassword(
      post('/api/auth/reset-password', { token, password: 'nueva-clave-123' }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_TOKEN');
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses a short password without burning the link', async () => {
    const res = await resetPassword(post('/api/auth/reset-password', { token, password: 'corta' }));
    expect(res.status).toBe(400);
    expect(consume).not.toHaveBeenCalled();
  });
});
