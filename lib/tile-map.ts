/**
 * Slippy-map math for the address preview map (components/address-map.tsx).
 *
 * Standard Web Mercator tiling as served by OpenStreetMap: at zoom z the
 * world is a square of 256·2^z pixels. Pure functions — unit-tested in
 * __tests__/tile-map.test.ts — so the component only does layout.
 */
import type { LatLon } from './carpool';

export const TILE_SIZE = 256;

export interface XY {
  x: number;
  y: number;
}

export interface MapView {
  /** Viewport center in world pixels at `zoom`. */
  center: XY;
  zoom: number;
}

export interface TileSpec {
  key: string;
  url: string;
  left: number;
  top: number;
}

/** World-pixel position of a coordinate at a zoom level. */
export function project(point: LatLon, zoom: number): XY {
  const scale = TILE_SIZE * 2 ** zoom;
  // Mercator is undefined at the poles; clamp to the tiled range.
  const lat = Math.max(-85.0511, Math.min(85.0511, point.lat));
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((point.lon + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale,
  };
}

/**
 * The closest view that shows every point inside the padded viewport. A
 * single point (or identical points) gets `singleZoom`: street level, enough
 * to recognize the block without implying door-number precision.
 */
export function fitView(
  points: LatLon[],
  width: number,
  height: number,
  padding = 36,
  maxZoom = 16,
  singleZoom = 15,
): MapView {
  if (points.length === 0) return { center: project({ lat: 0, lon: 0 }, 2), zoom: 2 };
  const innerW = Math.max(1, width - padding * 2);
  const innerH = Math.max(1, height - padding * 2);

  for (let zoom = maxZoom; zoom >= 2; zoom--) {
    const projected = points.map((p) => project(p, zoom));
    const xs = projected.map((p) => p.x);
    const ys = projected.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const single = maxX - minX < 1 && maxY - minY < 1;
    if (single && zoom > singleZoom) continue;
    if (maxX - minX <= innerW && maxY - minY <= innerH) {
      return { center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, zoom };
    }
  }
  const fallback = points.map((p) => project(p, 2));
  return { center: fallback[0], zoom: 2 };
}

/** Viewport-relative pixel position of a coordinate. */
export function toScreen(point: LatLon, view: MapView, width: number, height: number): XY {
  const p = project(point, view.zoom);
  return { x: p.x - view.center.x + width / 2, y: p.y - view.center.y + height / 2 };
}

/** Tiles covering the viewport, positioned relative to its top-left corner. */
export function tilesFor(
  view: MapView,
  width: number,
  height: number,
  urlTemplate: string,
): TileSpec[] {
  const count = 2 ** view.zoom;
  const originX = view.center.x - width / 2;
  const originY = view.center.y - height / 2;
  const tiles: TileSpec[] = [];
  for (let ty = Math.floor(originY / TILE_SIZE); ty * TILE_SIZE < originY + height; ty++) {
    if (ty < 0 || ty >= count) continue; // nothing above/below the world
    for (let tx = Math.floor(originX / TILE_SIZE); tx * TILE_SIZE < originX + width; tx++) {
      const wrapped = ((tx % count) + count) % count; // the world repeats east-west
      tiles.push({
        key: `${view.zoom}/${tx}/${ty}`,
        url: urlTemplate
          .replace('{z}', String(view.zoom))
          .replace('{x}', String(wrapped))
          .replace('{y}', String(ty)),
        left: Math.round(tx * TILE_SIZE - originX),
        top: Math.round(ty * TILE_SIZE - originY),
      });
    }
  }
  return tiles;
}

export const MIN_ZOOM = 3;
export const MAX_ZOOM = 18;

/**
 * Zoom by `delta` levels keeping the world point under `anchor` (viewport
 * pixels) fixed on screen — the anchor is the viewport center for the +/−
 * buttons and the cursor for double-click. Clamped to the tiled range.
 */
export function zoomView(
  view: MapView,
  delta: number,
  anchor: XY,
  width: number,
  height: number,
): MapView {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom + delta));
  if (zoom === view.zoom) return view;
  const factor = 2 ** (zoom - view.zoom);
  // World point currently under the anchor…
  const wx = view.center.x + (anchor.x - width / 2);
  const wy = view.center.y + (anchor.y - height / 2);
  // …stays under it after scaling the world.
  return {
    zoom,
    center: { x: wx * factor - (anchor.x - width / 2), y: wy * factor - (anchor.y - height / 2) },
  };
}

/** Moves the view by a screen-pixel drag (content follows the pointer). */
export function panView(view: MapView, dx: number, dy: number): MapView {
  return { zoom: view.zoom, center: { x: view.center.x - dx, y: view.center.y - dy } };
}
