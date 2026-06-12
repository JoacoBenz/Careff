import { describe, it, expect } from 'vitest';
import { planCarpool, generateMapUrl, type DistanceFn } from '@/lib/carpool';

/**
 * Synthetic geography: addresses are points on a line, distance is the
 * absolute difference. Lets us assert exact assignments and route lengths.
 */
const positions: Record<string, number> = {
  'driver-a': 0,
  'driver-b': 100,
  'p-near-a': 10,
  'p-near-b': 90,
  'p-middle': 60,
  destination: 50,
};

const lineDistance: DistanceFn = (from, to) => Math.abs(positions[from] - positions[to]);

describe('planCarpool', () => {
  const drivers = [
    { name: 'Ana', address: 'driver-a', capacity: 2 },
    { name: 'Beto', address: 'driver-b', capacity: 1 },
  ];

  it('assigns each passenger to the nearest driver with seats', () => {
    const result = planCarpool(
      drivers,
      [
        { name: 'Pia', address: 'p-near-a' },
        { name: 'Quim', address: 'p-near-b' },
      ],
      'destination',
      lineDistance,
    );
    expect(result.assignments).toEqual({ Pia: 'Ana', Quim: 'Beto' });
    expect(result.unassigned).toEqual([]);
  });

  it('respects capacity and overflows to the next nearest driver', () => {
    const result = planCarpool(
      drivers,
      [
        { name: 'Quim', address: 'p-near-b' },
        { name: 'Mara', address: 'p-middle' },
      ],
      'destination',
      lineDistance,
    );
    // Beto (capacity 1) takes Quim; Mara is closer to Beto but he is full.
    expect(result.assignments).toEqual({ Quim: 'Beto', Mara: 'Ana' });
  });

  it('reports passengers that fit in no car as unassigned', () => {
    const result = planCarpool(
      [{ name: 'Ana', address: 'driver-a', capacity: 1 }],
      [
        { name: 'Pia', address: 'p-near-a' },
        { name: 'Mara', address: 'p-middle' },
      ],
      'destination',
      lineDistance,
    );
    expect(result.assignments).toEqual({ Pia: 'Ana' });
    expect(result.unassigned).toEqual(['Mara']);
  });

  it('orders pickups nearest-first and sums leg distances', () => {
    const result = planCarpool(
      [{ name: 'Ana', address: 'driver-a', capacity: 2 }],
      [
        { name: 'Mara', address: 'p-middle' },
        { name: 'Pia', address: 'p-near-a' },
      ],
      'destination',
      lineDistance,
    );
    const route = result.routes[0];
    expect(route.stops.map((s) => s.name)).toEqual(['Pia', 'Mara']);
    expect(route.addresses).toEqual(['driver-a', 'p-near-a', 'p-middle', 'destination']);
    // 0→10 (10) + 10→60 (50) + 60→50 (10)
    expect(route.distanceMeters).toBe(70);
    expect(result.totalDistanceMeters).toBe(70);
  });

  it('includes drivers without pickups with a direct route to the destination', () => {
    const result = planCarpool(
      drivers,
      [{ name: 'Pia', address: 'p-near-a' }],
      'destination',
      lineDistance,
    );
    const beto = result.routes.find((r) => r.driver === 'Beto');
    expect(beto?.stops).toEqual([]);
    expect(beto?.addresses).toEqual(['driver-b', 'destination']);
    expect(beto?.distanceMeters).toBe(50);
  });
});

describe('generateMapUrl', () => {
  it('builds a Google Maps directions link with encoded waypoints', () => {
    const url = generateMapUrl(['Calle Falsa 123', 'Av. Siempreviva 742', 'Obelisco']);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=Calle%20Falsa%20123&destination=Obelisco&waypoints=Av.%20Siempreviva%20742',
    );
  });

  it('omits the waypoints parameter for direct routes', () => {
    const url = generateMapUrl(['A', 'B']);
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&origin=A&destination=B');
  });
});
