// Liveness probe. Intentionally a bare handler (no withAuth/withValidation):
// it takes no input, needs no session, and must stay dependency-free so it can
// report health even if auth/db are degraded.
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
