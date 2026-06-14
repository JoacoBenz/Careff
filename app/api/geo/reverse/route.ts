import { withOptionalAuth } from '@/lib/api-handler';
import { reverseProvince } from '@/lib/geo';

// Public: given the user's coordinates, return their province so the region
// selector can default to it (geolocation auto-detect).
export const GET = withOptionalAuth(async (request) => {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ province: null });
  }
  try {
    const province = await reverseProvince(lat, lon);
    return Response.json({ province });
  } catch {
    // Reverse lookup is a convenience; never fail the request over it.
    return Response.json({ province: null });
  }
});
