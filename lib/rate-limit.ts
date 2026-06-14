/**
 * Minimal in-memory fixed-window rate limiter for public/expensive endpoints.
 *
 * Scope: per-process. On a single instance it throttles abuse (carpool's ~41
 * external geocode calls, account creation, join spam); across multiple
 * serverless instances each has its own window, so treat this as a first line
 * of defense, not a hard global quota. Swap in a shared store (Redis/Upstash)
 * if you scale horizontally.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (bucket.count >= opts.limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count++;
  return { ok: true, retryAfterSec: 0 };
}

/** Best-effort client IP from the usual proxy headers. */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Enforces a per-IP limit for a named bucket. Returns a 429 Response when the
 * caller is over the limit, or null to proceed. Call early in the handler:
 *
 *   const limited = enforceRateLimit(request, 'carpool', { limit: 30, windowMs: 600_000 });
 *   if (limited) return limited;
 */
export function enforceRateLimit(
  request: Request,
  name: string,
  opts: RateLimitOptions,
): Response | null {
  const result = rateLimit(`${name}:${clientIp(request)}`, opts);
  if (result.ok) return null;
  // Build the uniform error body directly (no api-handler import — keeps this
  // module free of the auth/next-server chain so it stays unit-testable).
  return Response.json(
    {
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiadas solicitudes. Probá de nuevo en un momento.',
      },
    },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSec) } },
  );
}

/** Test-only: clears all buckets between cases. */
export function _resetRateLimits(): void {
  buckets.clear();
}
