/**
 * Geometry for the schematic route map shown with every plan.
 *
 * Saved plans don't store coordinates, but each route's Google Maps link does
 * (`origin=lat,lng&waypoints=…&destination=…`, see generateMapUrl). We read
 * them back from there, so the map works for old plans too with no schema
 * change. Pure functions — unit-tested in __tests__/route-map.test.ts.
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

export interface XY {
  x: number;
  y: number;
}

/**
 * Projects every route into one shared viewBox, keeping real-world
 * proportions (equirectangular with a cos(latitude) correction) and centering
 * the drawing inside `padding`.
 */
export function projectRoutes(
  routes: LatLon[][],
  width: number,
  height: number,
  padding: number,
): XY[][] {
  const all = routes.flat();
  if (all.length === 0) return routes.map(() => []);

  const midLat = (Math.min(...all.map((p) => p.lat)) + Math.max(...all.map((p) => p.lat))) / 2;
  const k = Math.cos((midLat * Math.PI) / 180);
  const flat = (p: LatLon): XY => ({ x: p.lon * k, y: -p.lat });

  const xs = all.map((p) => flat(p).x);
  const ys = all.map((p) => flat(p).y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  // All points identical (or a single point): draw it centered.
  const scale =
    spanX === 0 && spanY === 0 ? 1 : Math.min(innerW / (spanX || 1e-9), innerH / (spanY || 1e-9));
  const offsetX = padding + (innerW - spanX * scale) / 2;
  const offsetY = padding + (innerH - spanY * scale) / 2;

  const round = (n: number) => Math.round(n * 10) / 10;
  return routes.map((route) =>
    route.map((p) => {
      const f = flat(p);
      return { x: round(offsetX + (f.x - minX) * scale), y: round(offsetY + (f.y - minY) * scale) };
    }),
  );
}
