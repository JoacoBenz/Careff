import { useId } from 'react';
import type { DriverRoute } from '@/lib/carpool';
import { pointsFromMapUrl, projectRoutes } from '@/lib/route-map';
import { routeColor } from './route-colors';

const W = 640;
const H = 300;
const PAD = 38;

/**
 * Schematic map of a plan: one colored line per car from the driver's start,
 * through each pickup (numbered), to the shared destination. Straight
 * segments on purpose — it shows who picks up whom at a glance; turn-by-turn
 * lives in the Google Maps link. Renders nothing when a route has no
 * coordinates (plans computed from text-only addresses).
 */
export function RouteMap({ routes }: { routes: DriverRoute[] }) {
  // Unique per instance: /plans renders many maps, and a shared id would
  // resolve to a definition inside a collapsed (non-rendered) card.
  const uid = useId();
  const gridId = `${uid}-grid`;
  const glowId = `${uid}-glow`;
  const geo = routes.map((r) => pointsFromMapUrl(r.mapUrl));
  if (geo.length === 0 || geo.some((points) => points === null)) return null;
  const projected = projectRoutes(geo as NonNullable<(typeof geo)[number]>[], W, H, PAD);
  const destination = projected[0]?.[projected[0].length - 1];
  if (!destination) return null;

  return (
    <figure className="surface overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img">
        <title>Mapa esquemático: recorrido de cada auto hasta el destino</title>
        <defs>
          <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="rgba(148,163,184,0.09)" strokeWidth="1" />
          </pattern>
          <radialGradient id={glowId} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.10)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${gridId})`} />
        <rect width={W} height={H} fill={`url(#${glowId})`} />

        {projected.map((points, i) => {
          const color = routeColor(i);
          const d = points.map((p, n) => `${n === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
          return (
            <g key={routes[i].driver + i}>
              {/* soft halo + animated travel dashes + the line drawing in */}
              <path d={d} fill="none" stroke={color} strokeWidth="9" opacity="0.1" />
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                className="route-draw-once"
                style={{ ['--d' as string]: `${i * 250}ms` }}
              />
              <path
                d={d}
                fill="none"
                stroke="#fff"
                strokeWidth="1.2"
                strokeDasharray="2 13"
                strokeLinecap="round"
                opacity="0.55"
                className="route-flow"
              />
              {/* pickups, numbered in driving order */}
              {points.slice(1, -1).map((p, n) => (
                <g key={n}>
                  <circle cx={p.x} cy={p.y} r="9" fill="#0b1220" stroke={color} strokeWidth="2" />
                  <text
                    x={p.x}
                    y={p.y + 3.5}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={color}
                  >
                    {n + 1}
                  </text>
                </g>
              ))}
              {/* driver start */}
              <circle
                cx={points[0].x}
                cy={points[0].y}
                r="11"
                fill={color}
                opacity="0.3"
                className="node-pulse"
              />
              <circle cx={points[0].x} cy={points[0].y} r="6" fill={color} />
              <circle cx={points[0].x} cy={points[0].y} r="2.2" fill="#0b1220" />
            </g>
          );
        })}

        {/* shared destination */}
        <circle cx={destination.x} cy={destination.y} r="16" fill="#fff" opacity="0.12" />
        <circle
          cx={destination.x}
          cy={destination.y}
          r="9.5"
          fill="#fff"
          stroke="#0b1220"
          strokeWidth="2"
        />
        <path
          d={`M${destination.x - 2.5} ${destination.y + 4.5}v-9h6l-1.4 2.2 1.4 2.3h-6`}
          fill="none"
          stroke="#0b1220"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[var(--line)] px-4 py-2.5 text-xs text-[var(--ink-dim)]">
        {routes.map((route, i) => (
          <span key={route.driver + i} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: routeColor(i) }} />
            {route.driver}
          </span>
        ))}
        <span className="ml-auto text-[var(--ink-faint)]">Mapa esquemático · sin escala vial</span>
      </figcaption>
    </figure>
  );
}
