/**
 * Route coordinates for the plan map shown with every result.
 *
 * Saved plans don't store coordinates, but each route's Google Maps link does
 * (`origin=lat,lng&waypoints=…&destination=…`, see generateMapUrl). We read
 * them back from there, so the map works for old plans too with no schema
 * change. Pure function — unit-tested in __tests__/route-map.test.ts.
 */
import type { LatLon } from './carpool';

const COORD = /^(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/;

function parsePoint(raw: string): LatLon | null {
  const match = COORD.exec(raw.trim());
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/**
 * Ordered points of a route (driver start, pickups, destination) recovered
 * from its map link. Returns null when any stop is a text address rather than
 * coordinates — a partial map would misrepresent the route.
 */
export function pointsFromMapUrl(mapUrl: string): LatLon[] | null {
  let params: URLSearchParams;
  try {
    params = new URL(mapUrl).searchParams;
  } catch {
    return null;
  }
  const origin = params.get('origin');
  const destination = params.get('destination');
  if (!origin || !destination) return null;
  const waypoints = params.get('waypoints');
  const raw = [origin, ...(waypoints ? waypoints.split('|') : []), destination];
  const points: LatLon[] = [];
  for (const item of raw) {
    const point = parsePoint(item);
    if (!point) return null;
    points.push(point);
  }
  return points;
}
