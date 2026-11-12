import { describe, it, expect } from 'vitest';
import { TILE_SIZE, fitView, project, tilesFor, toScreen } from '@/lib/tile-map';

const OBELISCO = { lat: -34.6037, lon: -58.3816 };
const PILAR = { lat: -34.4587, lon: -58.9142 };
const URL = 'https://tiles.test/{z}/{x}/{y}.png';

describe('project', () => {
  it('puts lat/lon 0,0 at the center of the world', () => {
    expect(project({ lat: 0, lon: 0 }, 0)).toEqual({ x: 128, y: 128 });
  });

  it('matches the known OSM tile for a real place', () => {
    // Obelisco, Buenos Aires at z=15 lives in tile 11069/19744.
    const p = project(OBELISCO, 15);
    expect(Math.floor(p.x / TILE_SIZE)).toBe(11069);
    expect(Math.floor(p.y / TILE_SIZE)).toBe(19744);
  });

  it('clamps the poles instead of returning infinity', () => {
    expect(Number.isFinite(project({ lat: 90, lon: 0 }, 3).y)).toBe(true);
  });
});

describe('fitView', () => {
  it('centers a single point at street-level zoom', () => {
    const view = fitView([OBELISCO], 300, 200);
    expect(view.zoom).toBe(15);
    expect(toScreen(OBELISCO, view, 300, 200)).toEqual({ x: 150, y: 100 });
  });

  it('zooms out until every point fits inside the padding', () => {
    const view = fitView([OBELISCO, PILAR], 300, 200, 36);
    expect(view.zoom).toBeLessThan(15);
    for (const p of [OBELISCO, PILAR]) {
      const s = toScreen(p, view, 300, 200);
      expect(s.x).toBeGreaterThanOrEqual(36);
      expect(s.x).toBeLessThanOrEqual(264);
      expect(s.y).toBeGreaterThanOrEqual(36);
      expect(s.y).toBeLessThanOrEqual(164);
    }
  });

  it('picks the closest zoom that fits (one level in would overflow)', () => {
    const view = fitView([OBELISCO, PILAR], 300, 200, 36);
    const a = project(OBELISCO, view.zoom + 1);
    const b = project(PILAR, view.zoom + 1);
    expect(Math.abs(a.x - b.x) > 228 || Math.abs(a.y - b.y) > 128).toBe(true);
  });

  it('handles no points without throwing', () => {
    expect(fitView([], 300, 200).zoom).toBe(2);
  });
});

describe('tilesFor', () => {
  it('covers the whole viewport with no gaps', () => {
    const view = fitView([OBELISCO], 300, 200);
    const tiles = tilesFor(view, 300, 200, URL);
    const lefts = tiles.map((t) => t.left);
    const tops = tiles.map((t) => t.top);
    expect(Math.min(...lefts)).toBeLessThanOrEqual(0);
    expect(Math.max(...lefts) + TILE_SIZE).toBeGreaterThanOrEqual(300);
    expect(Math.min(...tops)).toBeLessThanOrEqual(0);
    expect(Math.max(...tops) + TILE_SIZE).toBeGreaterThanOrEqual(200);
  });

  it('builds tile URLs from the template', () => {
    const view = fitView([OBELISCO], 300, 200);
    const urls = tilesFor(view, 300, 200, URL).map((t) => t.url);
    expect(urls).toContain('https://tiles.test/15/11069/19744.png');
  });

  it('wraps east-west and never requests rows outside the world', () => {
    const view = { center: { x: 0, y: 0 }, zoom: 1 };
    const tiles = tilesFor(view, 300, 200, URL);
    expect(tiles.length).toBeGreaterThan(0);
    for (const t of tiles) expect(t.url).toMatch(/\/1\/[01]\/[01]\.png$/);
  });
});
