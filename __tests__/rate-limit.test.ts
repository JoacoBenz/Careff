import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, enforceRateLimit, _resetRateLimits } from '@/lib/rate-limit';

beforeEach(() => _resetRateLimits());

describe('rateLimit', () => {
  it('allows up to the limit then blocks within the window', () => {
    const opts = { limit: 2, windowMs: 60_000 };
    expect(rateLimit('k', opts).ok).toBe(true);
    expect(rateLimit('k', opts).ok).toBe(true);
    const third = rateLimit('k', opts);
    expect(third.ok).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });

  it('keys are independent', () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(rateLimit('a', opts).ok).toBe(true);
    expect(rateLimit('b', opts).ok).toBe(true);
  });
});

describe('enforceRateLimit', () => {
  const reqFrom = (ip: string) =>
    new Request('http://localhost/api/x', { headers: { 'x-forwarded-for': ip } });

  it('returns null while under the limit and a 429 once over', async () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(enforceRateLimit(reqFrom('1.1.1.1'), 'test', opts)).toBeNull();
    const blocked = enforceRateLimit(reqFrom('1.1.1.1'), 'test', opts);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get('Retry-After')).toBeTruthy();
    const body = (await blocked?.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('separates clients by IP', () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(enforceRateLimit(reqFrom('2.2.2.2'), 'test', opts)).toBeNull();
    expect(enforceRateLimit(reqFrom('3.3.3.3'), 'test', opts)).toBeNull();
  });
});
