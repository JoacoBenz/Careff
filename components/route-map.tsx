import type { DriverRoute } from '@/lib/carpool';
import { pointsFromMapUrl } from '@/lib/route-map';
import { AddressMap, type MapPin, type MapRoute } from './address-map';
import { routeColor } from './route-colors';

/**
 * The plan on a real street map (OpenStreetMap): one colored line per car
 * from the driver's start through each pickup (numbered in driving order) to
 * the shared destination, with the same pan/zoom as the address map. Lines
 * join the stops straight — the turn-by-turn route lives in each car's
 * Google Maps link. Renders nothing when a route has no coordinates (plans
 * computed from text-only addresses).
 */
export function RouteMap({ routes }: { routes: DriverRoute[] }) {
  const geo = routes.map((r) => pointsFromMapUrl(r.mapUrl));
  if (geo.length === 0 || geo.some((points) => points === null)) return null;
  const located = geo as NonNullable<(typeof geo)[number]>[];

  const lines: MapRoute[] = located.map((points, i) => ({
    id: `route-${i}`,
    color: routeColor(i),
    points,
  }));

  const pins: MapPin[] = [];
  located.forEach((points, i) => {
    const color = routeColor(i);
    const route = routes[i];
    pins.push({
      id: `start-${i}`,
      label: route.driver,
      kind: 'driver',
      color,
      showLabel: true,
      ...points[0],
    });
    points.slice(1, -1).forEach((point, n) => {
      pins.push({
        id: `stop-${i}-${n}`,
        label: route.stops[n]?.name ?? `Parada ${n + 1}`,
        kind: 'passenger',
        color,
        text: String(n + 1),
        ...point,
      });
    });
  });
  const destination = located[0][located[0].length - 1];
  pins.push({ id: 'dest', label: 'Destino', kind: 'destination', showLabel: true, ...destination });

  return (
    <figure className="surface overflow-hidden p-3">
      <AddressMap pins={pins} routes={lines} height={360} />
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-[var(--ink-dim)]">
        {routes.map((route, i) => (
          <span key={route.driver + i} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: routeColor(i) }} />
            {route.driver}
          </span>
        ))}
        <span className="ml-auto text-[var(--ink-faint)]">
          Líneas directas entre paradas · el recorrido por calle está en Google Maps
        </span>
      </figcaption>
    </figure>
  );
}
