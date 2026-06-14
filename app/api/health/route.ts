import pkg from '@/package.json';
import { prisma } from '@/lib/prisma';

// Observability contract (docs: Mission Control). Polled by Mission Control and
// any uptime monitor: reports app + database health, version and template
// lineage. Returns 503 when the database is unreachable.
export const dynamic = 'force-dynamic';

const startedAt = Date.now();

export async function GET() {
  let db: 'ok' | 'error' = 'error';
  let dbLatencyMs: number | null = null;
  const t = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'ok';
    dbLatencyMs = Date.now() - t;
  } catch {
    db = 'error';
  }
  const ok = db === 'ok';
  return Response.json(
    {
      status: ok ? 'ok' : 'degraded',
      db,
      dbLatencyMs,
      version: pkg.version,
      templateVersion: pkg.goldenTemplate?.version ?? null,
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
