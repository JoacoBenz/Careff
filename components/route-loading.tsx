'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  'Ubicando las direcciones en el mapa…',
  'Midiendo distancias reales por calle…',
  'Probando combinaciones de autos…',
  'Eligiendo el orden de las paradas…',
  'Optimizando el viaje de todo el grupo…',
];

const ROUTE_PATH = 'M20 95 L70 38 L120 82 L168 28 L208 88';

/**
 * Overlay shown while /api/carpool computes: a route draws itself across a
 * mini city map, a car drives it on loop, and the status line cycles through
 * what the engine is actually doing.
 */
export function RouteLoading() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((index) => (index + 1) % MESSAGES.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-2xl">
        <svg viewBox="0 0 228 120" className="mx-auto w-full" aria-hidden>
          {/* city blocks */}
          {[24, 48, 72, 96].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="228" y2={y} stroke="#d1fae5" strokeWidth="1" />
          ))}
          {[38, 76, 114, 152, 190].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="120" stroke="#d1fae5" strokeWidth="1" />
          ))}

          {/* route drawing itself, on loop */}
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8 7"
            className="route-flow"
          />
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            strokeDasharray={100}
            className="route-draw"
          />

          {/* pickups */}
          {[
            [20, 95],
            [70, 38],
            [120, 82],
            [168, 28],
          ].map(([x, y], i) => (
            <g key={`${x},${y}`}>
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="#34d399"
                opacity="0.35"
                className="node-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              <circle cx={x} cy={y} r="3.5" fill="#059669" />
            </g>
          ))}

          {/* destination */}
          <circle cx="208" cy="88" r="9" fill="#fbbf24" opacity="0.4" className="node-pulse" />
          <text x="208" y="93" textAnchor="middle" fontSize="13">
            🏁
          </text>

          {/* the car drives the route */}
          <text fontSize="15" dy="-7">
            🚗
            <animateMotion dur="3.2s" repeatCount="indefinite" path={ROUTE_PATH} />
          </text>
        </svg>

        <p className="mt-4 h-5 text-sm font-medium text-slate-700" key={messageIndex}>
          <span className="message-fade inline-block">{MESSAGES[messageIndex]}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">Esto tarda unos segundos con datos reales</p>
      </div>
    </div>
  );
}
