'use client';

import { useEffect, useRef, useState } from 'react';
import { fitView, tilesFor, toScreen } from '@/lib/tile-map';
import { PinIcon } from './icons';

// OpenStreetMap's standard tiles: free, no API key. Their usage policy asks
// for visible attribution (rendered below) and light traffic — one small map
// per form, lazily loaded, fits comfortably.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export interface MapPin {
  id: string;
  label: string;
  kind: 'driver' | 'passenger' | 'destination';
  lat: number;
  lon: number;
}

const PIN_STYLE: Record<MapPin['kind'], string> = {
  driver: 'bg-amber-400 text-[#1c1003]',
  passenger: 'bg-sky-400 text-[#04121c]',
  destination: 'bg-white text-[#0b1220]',
};

/**
 * One shared preview map for a whole form: every address picked from the
 * autocomplete shows up as a pin so people can check it landed in the right
 * place. `focusId` zooms to a single pin (the address just chosen); without
 * it the map fits them all. Static on purpose — no pan/zoom library; the
 * question it answers is "is this roughly where I meant?".
 */
export function AddressMap({
  pins,
  focusId,
  onShowAll,
  height = 200,
  emptyHint = 'Elegí una dirección de la lista y la vas a ver acá para confirmarla.',
}: {
  pins: MapPin[];
  focusId?: string | null;
  onShowAll?: () => void;
  height?: number;
  emptyHint?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Track the rendered width: the tile grid is computed in pixels. A hidden
  // instance (the planner renders one per breakpoint) measures 0 and draws
  // nothing, so only the visible map ever requests tiles.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0].contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const focused = focusId ? pins.find((p) => p.id === focusId) : undefined;
  const view = fitView(focused ? [focused] : pins, width, height);
  const tiles = width > 0 && pins.length > 0 ? tilesFor(view, width, height, TILE_URL) : [];

  return (
    <div>
      <div
        ref={boxRef}
        className="surface-inset relative overflow-hidden"
        style={{ height }}
        role="img"
        aria-label={
          pins.length > 0
            ? `Mapa con ${pins.length} dirección${pins.length === 1 ? '' : 'es'} ubicada${pins.length === 1 ? '' : 's'}: ${pins.map((p) => p.label).join(', ')}`
            : 'Mapa de direcciones (todavía sin puntos)'
        }
      >
        {pins.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <PinIcon className="h-6 w-6 text-[var(--ink-faint)]" />
            <p className="text-xs text-[var(--ink-dim)]">{emptyHint}</p>
          </div>
        ) : (
          <>
            {/* Tiles are light-themed; invert + hue-rotate turns them into a
                night map that matches the UI while keeping water/parks legible. */}
            <div
              className="absolute inset-0"
              style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.88)' }}
              aria-hidden
            >
              {tiles.map((tile) => (
                // Plain <img>: these are third-party map tiles positioned by
                // pixel math — next/image optimization doesn't apply.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={tile.key}
                  src={tile.url}
                  alt=""
                  width={256}
                  height={256}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute max-w-none select-none"
                  style={{ left: tile.left, top: tile.top }}
                  draggable={false}
                />
              ))}
            </div>
            {width > 0 &&
              pins.map((pin) => {
                const pos = toScreen(pin, view, width, height);
                const isFocus = focused?.id === pin.id;
                if (pos.x < -20 || pos.x > width + 20 || pos.y < -20 || pos.y > height + 20) {
                  return null;
                }
                return (
                  <span
                    key={pin.id}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                    style={{ left: pos.x, top: pos.y, zIndex: isFocus ? 2 : 1 }}
                    aria-hidden
                  >
                    {isFocus && (
                      <span className="node-pulse absolute h-9 w-9 rounded-full bg-amber-300/40" />
                    )}
                    <span
                      className={`relative flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold shadow-lg ring-2 ring-[#030712] ${PIN_STYLE[pin.kind]}`}
                    >
                      {pin.kind === 'destination' ? '⚑' : pin.label.trim().charAt(0).toUpperCase()}
                    </span>
                    {(isFocus || pins.length <= 4) && (
                      <span className="mt-1 max-w-28 truncate rounded-md bg-[#030712]/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {pin.label}
                      </span>
                    )}
                  </span>
                );
              })}
            {focused && onShowAll && pins.length > 1 && (
              <button
                type="button"
                onClick={onShowAll}
                className="absolute right-2 top-2 z-10 rounded-lg bg-[#030712]/85 px-2 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-[var(--line-strong)] hover:bg-[#030712]"
              >
                Ver todos
              </button>
            )}
          </>
        )}
      </div>
      {pins.length > 0 && (
        <p className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[var(--ink-faint)]">
          <span>Ubicación aproximada — confirmá que sea la zona correcta.</span>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none hover:text-[var(--ink-dim)]"
          >
            © OpenStreetMap
          </a>
        </p>
      )}
    </div>
  );
}
