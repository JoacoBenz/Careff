import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { z } from 'zod';

// Isolate the wrapper from real auth/db/logging.
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logApiError: vi.fn() }));

import { auth } from '@/lib/auth';
import { logApiError } from '@/lib/logger';
import { withAuth, withOptionalAuth, withValidation } from '@/lib/api-handler';

// `auth` is an overloaded NextAuth export; treat the mock as a plain spy here.
const mockAuth = auth as unknown as Mock;

const sessionFor = (id: string): any => ({ user: { id } });

function jsonReq(body?: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('withAuth', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await withAuth(async () => Response.json({ ok: true }))(jsonReq());
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('invokes the handler with the session when authenticated', async () => {
    mockAuth.mockResolvedValue(sessionFor('7'));
    const res = await withAuth(async (_req, { session }) => Response.json({ id: session.user.id }))(
      jsonReq(),
    );
    expect(res.status).toBe(200);
    expect((await res.json()) as { id: string }).toEqual({ id: '7' });
  });

  it('maps a thrown handler error to 500 and logs it', async () => {
    mockAuth.mockResolvedValue(sessionFor('1'));
    const res = await withAuth(async () => {
      throw new Error('boom');
    })(jsonReq());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INTERNAL');
    expect(logApiError).toHaveBeenCalledTimes(1);
  });
});

describe('withOptionalAuth', () => {
  it('passes session: null for guests', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await withOptionalAuth(async (_req, { session }) =>
      Response.json({ guest: session === null }),
    )(jsonReq());
    expect((await res.json()) as { guest: boolean }).toEqual({ guest: true });
  });

  it('passes the session when present', async () => {
    mockAuth.mockResolvedValue(sessionFor('9'));
    const res = await withOptionalAuth(async (_req, { session }) =>
      Response.json({ id: session?.user.id ?? null }),
    )(jsonReq());
    expect((await res.json()) as { id: string }).toEqual({ id: '9' });
  });
});

describe('withValidation', () => {
  const schema = z.object({ name: z.string().min(1) });
  type Ctx = { session: null };
  const handler = withValidation<{ name: string }, Ctx>(schema, async (_req, { data }) =>
    Response.json({ name: data.name }),
  );

  it('rejects a non-JSON body with INVALID_JSON', async () => {
    const res = await handler(jsonReq('not json'), { session: null });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('INVALID_JSON');
  });

  it('rejects a schema violation with VALIDATION + issues', async () => {
    const res = await handler(jsonReq({ name: '' }), { session: null });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; issues: unknown[] } };
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.issues.length).toBeGreaterThan(0);
  });

  it('passes validated data through to the handler', async () => {
    const res = await handler(jsonReq({ name: 'Ada' }), { session: null });
    expect(res.status).toBe(200);
    expect((await res.json()) as { name: string }).toEqual({ name: 'Ada' });
  });
});
