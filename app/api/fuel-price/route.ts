import { withOptionalAuth } from '@/lib/api-handler';
import { suggestFuelPrice } from '@/lib/fuel';

// Public: suggests a current Nafta Súper price (per litre) to pre-fill the trip
// expense estimator. Best-effort — returns { price: null } when unavailable, so
// the client keeps its editable default.
export const revalidate = 3600;

export const GET = withOptionalAuth(async (request) => {
  const url = new URL(request.url);
  const prov = url.searchParams.get('prov') ?? undefined;
  const suggestion = await suggestFuelPrice(prov);
  return Response.json(suggestion ?? { price: null });
});
