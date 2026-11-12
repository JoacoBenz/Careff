'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  fitView,
  panView,
  tilesFor,
  toScreen,
  zoomView,
  type MapView,
} from '@/lib/tile-map';
import { CloseIcon, PinIcon, PlusIcon } from './icons';

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
 * it the map fits them all. People can drag to look around and zoom with the
 * mouse wheel, the +/− buttons or a double-click, to check the surrounding
 * streets. Hand-rolled
 * (lib/tile-map.ts) instead of a map library: it only needs pan + zoom.
 */
export function AddressMap({
  pins,
  focusId,
  onShowAll,
  onClose,
  height = 200,
  emptyHint = 'Elegí una dirección de la lista y la vas a ver acá para confirmarla.',
}: {
  pins: MapPin[];
  focusId?: string | null;
  onShowAll?: () => void;
  /** Renders a close button (used by the inline map on phones). */
  onClose?: () => void;
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
  const fitted = fitView(focused ? [focused] : pins, width, height);

  // Manual pan/zoom is kept only while the pins and focus stay the same:
  // picking another address re-frames the map on it.
  const frameKey = `${focusId ?? '*'}|${pins.map((p) => `${p.id}:${p.lat},${p.lon}`).join(';')}|${width}`;
  const [manual, setManual] = useState<{ key: string; view: MapView } | null>(null);
  const view = manual?.key === frameKey ? manual.view : fitted;
  const tiles = width > 0 && pins.length > 0 ? tilesFor(view, width, height, TILE_URL) : [];

  const drag = useRef<{ id: number; x: number; y: number; start: MapView } | null>(null);
  const setView = (next: MapView) => setManual({ key: frameKey, view: next });

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button, a')) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: view };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    setView(panView(d.start, event.clientX - d.x, event.clientY - d.y));
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id === event.pointerId) drag.current = null;
  }
  const zoomBy = (delta: number) =>
    setView(zoomView(view, delta, { x: width / 2, y: height / 2 }, width, height));
  const moved = manual?.key === frameKey;

  // Mouse-wheel zoom anchored on the cursor. Needs a native non-passive
  // listener: React's onWheel is passive, so it can't stop the page from
  // scrolling while the pointer is over the map. Deltas are accumulated so a
  // trackpad's many tiny events step one zoom level at a time, not ten.
  const latest = useRef({ view, width, height, frameKey, active: pins.length > 0 });
  useEffect(() => {
    latest.current = { view, width, height, frameKey, active: pins.length > 0 };
  });
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let accumulated = 0;
    function onWheel(event: WheelEvent) {
      const { view: current, width: w, height: h, frameKey: key, active } = latest.current;
      if (!active || w === 0) return;
      event.preventDefault();
      accumulated += event.deltaY * (event.deltaMode === 1 ? 33 : 1); // lines → px
      if (Math.abs(accumulated) < 60) return;
      const delta = accumulated < 0 ? 1 : -1;
      accumulated = 0;
      const rect = el!.getBoundingClientRect();
      const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setManual({ key, view: zoomView(current, delta, anchor, w, h) });
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div>
      <div
        ref={boxRef}
        className={`surface-inset relative overflow-hidden ${pins.length > 0 ? 'cursor-grab touch-none active:cursor-grabbing' : ''}`}
        style={{ height }}
        onPointerDown={pins.length > 0 ? onPointerDown : undefined}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(event) => {
          if (pins.length === 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          setView(
            zoomView(
              view,
              1,
              { x: event.clientX - rect.left, y: event.clientY - rect.top },
              width,
              height,
            ),
          );
        }}
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
            <div className="absolute left-2 top-2 z-10 flex gap-1.5">
              {focused && onShowAll && pins.length > 1 && (
                <button
                  type="button"
                  onClick={onShowAll}
                  className="rounded-lg bg-[#030712]/85 px-2 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-[var(--line-strong)] hover:bg-[#030712]"
                >
                  Ver todos
                </button>
              )}
              {moved && (
                <button
                  type="button"
                  onClick={() => setManual(null)}
                  className="rounded-lg bg-[#030712]/85 px-2 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-[var(--line-strong)] hover:bg-[#030712]"
                >
                  Centrar
                </button>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar mapa"
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-[#030712]/85 text-white ring-1 ring-[var(--line-strong)] hover:bg-[#030712]"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="absolute bottom-2 right-2 z-10 flex flex-col overflow-hidden rounded-lg bg-[#030712]/85 ring-1 ring-[var(--line-strong)]">
              <button
                type="button"
                onClick={() => zoomBy(1)}
                disabled={view.zoom >= MAX_ZOOM}
                aria-label="Acercar"
                className="flex h-8 w-8 items-center justify-center text-white hover:bg-white/10 disabled:opacity-30"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              <span className="h-px bg-[var(--line-strong)]" aria-hidden />
              <button
                type="button"
                onClick={() => zoomBy(-1)}
                disabled={view.zoom <= MIN_ZOOM}
                aria-label="Alejar"
                className="flex h-8 w-8 items-center justify-center text-white hover:bg-white/10 disabled:opacity-30"
              >
                <span className="block h-[2px] w-3.5 rounded bg-current" aria-hidden />
              </button>
            </div>
          </>
        )}
      </div>
      {pins.length > 0 && (
        <p className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[var(--ink-faint)]">
          <span>Arrastrá para recorrer · ruedita o +/− para zoom. Ubicación aproximada.</span>
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
