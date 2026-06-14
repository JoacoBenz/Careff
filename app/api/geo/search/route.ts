import { apiError, withOptionalAuth } from '@/lib/api-handler';
import { searchAddresses, GeoProviderError } from '@/lib/geo';
import { geoSearchSchema } from '@/lib/validators';
import { enforceRateLimit } from '@/lib/rate-limit';

// Public: powers the address autocomplete in the planner (guest mode included).
export const GET = withOptionalAuth(async (request) => {
  // Autocomplete is debounced + cached client-side; this bounds abusive bursts.
  const limited = enforceRateLimit(request, 'geo-search', { limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const url = new URL(request.url);
  const result = geoSearchSchema.safeParse({
    q: url.searchParams.get('q') ?? '',
    country: url.searchParams.get('country') ?? undefined,
    prov: url.searchParams.get('prov') ?? undefined,
  });
  if (!result.success) {
    return Response.json({ suggestions: [] });
  }
  try {
    const suggestions = await searchAddresses(result.data.q, {
      country: result.data.country,
      provincia: result.data.prov,
    });
    return Response.json({ suggestions });
  } catch (error) {
    if (error instanceof GeoProviderError) {
      return apiError('GEO_UNAVAILABLE', 'El servicio de mapas no está disponible.', 503);
    }
    throw error;
  }
});
