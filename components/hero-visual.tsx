import { WhatsAppIcon } from './icons';

// Two cars converging on one destination — the product in a single picture.
const ROUTE_A = 'M58 250 L150 190 L232 214 L330 120';
const ROUTE_B = 'M392 268 L378 196 L330 120';

/**
 * The landing's product visual: a night map where two routes draw themselves
 * to the destination, with a live "plan" card and the WhatsApp message a
 * driver receives. Pure SVG/CSS (no images), decorative for screen readers.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="surface overflow-hidden">
        <svg viewBox="0 0 440 320" className="block w-full">
          <defs>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgba(148,163,184,0.10)" strokeWidth="1" />
            </pattern>
            <radialGradient id="hero-glow" cx="75%" cy="38%" r="55%">
              <stop offset="0%" stopColor="rgba(251,191,36,0.22)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0)" />
            </radialGradient>
          </defs>
          <rect width="440" height="320" fill="url(#hero-grid)" />
          <rect width="440" height="320" fill="url(#hero-glow)" />
          {/* a river and an avenue so it reads as a city, not a chart */}
          <path
            d="M-10 60 C90 90 150 30 250 62 S400 40 460 86"
            fill="none"
            stroke="rgba(56,189,248,0.14)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path d="M0 290 L440 150" stroke="rgba(148,163,184,0.14)" strokeWidth="6" />

          {[
            { d: ROUTE_A, color: '#fbbf24', delay: '0ms' },
            { d: ROUTE_B, color: '#38bdf8', delay: '500ms' },
          ].map((route) => (
            <g key={route.d}>
              <path d={route.d} fill="none" stroke={route.color} strokeWidth="10" opacity="0.1" />
              <path
                d={route.d}
                fill="none"
                stroke={route.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                className="route-draw-once"
                style={{ ['--d' as string]: route.delay }}
              />
              <path
                d={route.d}
                fill="none"
                stroke="#fff"
                strokeWidth="1.4"
                strokeDasharray="2 14"
                strokeLinecap="round"
                opacity="0.6"
                className="route-flow"
              />
              <circle r="5" fill="#fff">
                <animateMotion dur="5s" repeatCount="indefinite" path={route.d} />
              </circle>
            </g>
          ))}

          {/* pickups */}
          {[
            [150, 190, '#fbbf24', '1'],
            [232, 214, '#fbbf24', '2'],
            [378, 196, '#38bdf8', '1'],
          ].map(([x, y, color, n]) => (
            <g key={`${x}-${y}`}>
              <circle
                cx={x}
                cy={y}
                r="10"
                fill="#0b1220"
                stroke={color as string}
                strokeWidth="2"
              />
              <text
                x={x}
                y={Number(y) + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={color as string}
              >
                {n}
              </text>
            </g>
          ))}
          {/* driver starts */}
          {[
            [58, 250, '#fbbf24'],
            [392, 268, '#38bdf8'],
          ].map(([x, y, color]) => (
            <g key={`${x}-${y}`}>
              <circle
                cx={x}
                cy={y}
                r="12"
                fill={color as string}
                opacity="0.3"
                className="node-pulse"
              />
              <circle cx={x} cy={y} r="6.5" fill={color as string} />
              <circle cx={x} cy={y} r="2.4" fill="#0b1220" />
            </g>
          ))}
          {/* destination */}
          <circle cx="330" cy="120" r="20" fill="#fff" opacity="0.12" className="node-pulse" />
          <circle cx="330" cy="120" r="11" fill="#fff" />
          <path
            d="M327 125.5v-11h7.5l-1.8 2.7 1.8 2.8H327"
            fill="none"
            stroke="#0b1220"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Cumple de Martina</p>
            <p className="text-xs text-[var(--ink-dim)]">2 autos · 3 pasajeros · 18,4 km</p>
          </div>
          <span className="chip chip-ok">Plan listo</span>
        </div>
      </div>

      {/* the message a driver gets */}
      <div
        className="float absolute -bottom-9 -left-3 w-56 rounded-2xl rounded-bl-md border border-emerald-400/25 bg-[#0c1f17]/95 p-3 text-xs shadow-2xl backdrop-blur sm:-left-10"
        style={{ ['--d' as string]: '400ms' }}
      >
        <p className="flex items-center gap-1.5 font-semibold text-emerald-300">
          <WhatsAppIcon className="h-3.5 w-3.5" /> Sofi, esta es tu ruta
        </p>
        <p className="mt-1.5 leading-relaxed text-emerald-50/80">
          1. Buscar a Nico — Thames 1820
          <br />
          2. Buscar a Juli — Gorriti 4500
          <br />
          Destino: Av. Corrientes 1234
        </p>
      </div>
      <div className="float absolute -right-2 -top-4 rounded-2xl border border-amber-400/30 bg-[#1a1405]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur sm:-right-6">
        <p className="text-[var(--ink-dim)]">Cada uno pone</p>
        <p className="text-base font-bold text-amber-300">$ 2.150</p>
      </div>
    </div>
  );
}
