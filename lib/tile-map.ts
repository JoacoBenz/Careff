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
