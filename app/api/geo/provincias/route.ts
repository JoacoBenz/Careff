import { apiError, withOptionalAuth } from '@/lib/api-handler';
import { listProvinces, GeoProviderError } from '@/lib/geo';

// Public: the list of Argentine provinces for the region selector. Cached at
// the edge for a day — the list effectively never changes.
export const revalidate = 86400;

export const GET = withOptionalAuth(async () => {
  try {
    const provinces = await listProvinces();
    return Response.json({ provinces });
  } catch (error) {
    if (error instanceof GeoProviderError) {
      return apiError('GEO_UNAVAILABLE', 'El servicio de mapas no está disponible.', 503);
    }
    throw error;
  }
});
