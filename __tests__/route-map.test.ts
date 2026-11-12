import { describe, it, expect } from 'vitest';
import { generateMapUrl } from '@/lib/carpool';
import { pointsFromMapUrl } from '@/lib/route-map';

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
