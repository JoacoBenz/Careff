import { apiError, withOptionalAuth } from '@/lib/api-handler';
import { searchAddresses, GeoProviderError } from '@/lib/geo';
import { geoSearchSchema } from '@/lib/validators';

// Public: powers the address autocomplete in the planner (guest mode included).
export const GET = withOptionalAuth(async (request) => {
  const url = new URL(request.url);
  const result = geoSearchSchema.safeParse({ q: url.searchParams.get('q') ?? '' });
  if (!result.success) {
    return Response.json({ suggestions: [] });
  }
  try {
    const suggestions = await searchAddresses(result.data.q);
    return Response.json({ suggestions });
  } catch (error) {
    if (error instanceof GeoProviderError) {
      return apiError('GEO_UNAVAILABLE', 'El servicio de mapas no está disponible.', 503);
    }
    throw error;
  }
});
