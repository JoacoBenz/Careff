import { withOptionalAuth } from '@/lib/api-handler';
import { suggestFuelPrice } from '@/lib/fuel';
import { fuelPriceQuerySchema } from '@/lib/validators';

// Public: suggests a current Nafta Súper price (per litre) to pre-fill the trip
// expense estimator. Best-effort — returns { price: null } when unavailable, so
// the client keeps its editable default.
export const revalidate = 3600;

export const GET = withOptionalAuth(async (request) => {
  const url = new URL(request.url);
  // Validate prov (charset-restricted); on invalid input fall back to the
  // national average rather than failing this convenience endpoint.
  const parsed = fuelPriceQuerySchema.safeParse({
    prov: url.searchParams.get('prov') ?? undefined,
  });
  const prov = parsed.success ? parsed.data.prov : undefined;
  const suggestion = await suggestFuelPrice(prov);
  return Response.json(suggestion ?? { price: null });
});
