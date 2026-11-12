import { describe, it, expect } from 'vitest';
import { generateMapUrl } from '@/lib/carpool';
import { pointsFromMapUrl, projectRoutes } from '@/lib/route-map';

describe('pointsFromMapUrl', () => {
  it('round-trips the coordinates generateMapUrl writes', () => {
    const coords = new Map([
      ['a', { lat: -34.6037, lon: -58.3816 }],
      ['b', { lat: -34.58, lon: -58.42 }],
      ['c', { lat: -34.55, lon: -58.45 }],
    ]);
    const points = pointsFromMapUrl(generateMapUrl(['a', 'b', 'c'], coords));
    expect(points).toEqual([
      { lat: -34.6037, lon: -58.3816 },
      { lat: -34.58, lon: -58.42 },
      { lat: -34.55, lon: -58.45 },
    ]);
  });

  it('handles a direct route with no waypoints', () => {
    const coords = new Map([
      ['a', { lat: 1, lon: 2 }],
      ['b', { lat: 3, lon: 4 }],
    ]);
    expect(pointsFromMapUrl(generateMapUrl(['a', 'b'], coords))).toHaveLength(2);
  });

  it('returns null when a stop is a text address (no partial maps)', () => {
    const coords = new Map([['a', { lat: 1, lon: 2 }]]);
    expect(pointsFromMapUrl(generateMapUrl(['a', 'Av. Siempre Viva 742'], coords))).toBeNull();
  });

  it('returns null for malformed or out-of-range input', () => {
    expect(pointsFromMapUrl('not a url')).toBeNull();
    expect(pointsFromMapUrl('https://www.google.com/maps/dir/?api=1')).toBeNull();
    expect(
      pointsFromMapUrl('https://www.google.com/maps/dir/?api=1&origin=95,10&destination=1,2'),
    ).toBeNull();
  });
});

describe('projectRoutes', () => {
  it('keeps every point inside the padded viewBox', () => {
    const routes = [
      [
        { lat: -34.6, lon: -58.4 },
        { lat: -34.5, lon: -58.5 },
      ],
      [
        { lat: -34.7, lon: -58.3 },
        { lat: -34.5, lon: -58.5 },
      ],
    ];
    for (const route of projectRoutes(routes, 400, 240, 24)) {
      for (const { x, y } of route) {
        expect(x).toBeGreaterThanOrEqual(24);
        expect(x).toBeLessThanOrEqual(376);
        expect(y).toBeGreaterThanOrEqual(24);
        expect(y).toBeLessThanOrEqual(216);
      }
    }
  });

  it('puts north at the top and east on the right', () => {
    const [[south, north]] = projectRoutes(
      [
        [
          { lat: -35, lon: -59 },
          { lat: -34, lon: -58 },
        ],
      ],
      400,
      240,
      24,
    );
    expect(north.y).toBeLessThan(south.y);
    expect(north.x).toBeGreaterThan(south.x);
  });

  it('centers a degenerate single location instead of dividing by zero', () => {
    const [[p]] = projectRoutes([[{ lat: 10, lon: 10 }]], 400, 240, 24);
    expect(p).toEqual({ x: 200, y: 120 });
  });

  it('returns empty routes for empty input', () => {
    expect(projectRoutes([[]], 400, 240, 24)).toEqual([[]]);
  });
});
