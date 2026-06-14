import { withOptionalAuth } from '@/lib/api-handler';
import { reverseProvince } from '@/lib/geo';
import { geoReverseSchema } from '@/lib/validators';

// Public: given the user's coordinates, return their province so the region
// selector can default to it (geolocation auto-detect).
export const GET = withOptionalAuth(async (request) => {
  const url = new URL(request.url);
  const parsed = geoReverseSchema.safeParse({
    lat: url.searchParams.get('lat'),
    lon: url.searchParams.get('lon'),
  });
  if (!parsed.success) {
    return Response.json({ province: null });
  }
  try {
    const province = await reverseProvince(parsed.data.lat, parsed.data.lon);
    return Response.json({ province });
  } catch {
    // Reverse lookup is a convenience; never fail the request over it.
    return Response.json({ province: null });
  }
});
