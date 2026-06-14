import { describe, it, expect } from 'vitest';
import { planCarpool, generateMapUrl, withCity, type DistanceFn } from '@/lib/carpool';

describe('withCity', () => {
  it('appends the city to short hand-typed addresses', () => {
    expect(withCity('Senillosa 200', 'Buenos Aires')).toBe('Senillosa 200, Buenos Aires');
  });

  it('leaves canonical autocomplete addresses untouched', () => {
    const canonical =
      'Doctor Enrique Finochietto 990, Parque Patricios, Buenos Aires, Comuna 4, Ciudad Autónoma de Buenos Aires, C1264AAN, Argentina';
    expect(withCity(canonical, 'Buenos Aires, Argentina')).toBe(canonical);
  });

  it('does not duplicate a city the address already mentions', () => {
    expect(withCity('Av. Corrientes 1234, buenos aires', 'Buenos Aires')).toBe(
      'Av. Corrientes 1234, buenos aires',
    );
  });

  it('ignores empty or blank city values', () => {
    expect(withCity('Senillosa 200')).toBe('Senillosa 200');
    expect(withCity('Senillosa 200', '   ')).toBe('Senillosa 200');
  });
});

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

describe('planCarpool — multi-driver efficiency', () => {
  it('assigns to the driver whose route detours least, not the one who lives closest', () => {
    // X lives closest to Ana's home (5 vs 8) but is completely off Ana's way
    // to the destination, while sitting almost exactly on Beto's way.
    const d: Record<string, Record<string, number>> = {
      'a-home': { x: 5, dest: 10, 'b-home': 100 },
      'b-home': { x: 8, dest: 30, 'a-home': 100 },
      x: { 'a-home': 5, 'b-home': 8, dest: 20 },
      dest: { 'a-home': 10, 'b-home': 30, x: 20 },
    };
    const mapDistance: DistanceFn = (from, to) => (from === to ? 0 : d[from][to]);

    const result = planCarpool(
      [
        { name: 'Ana', address: 'a-home', capacity: 1 },
        { name: 'Beto', address: 'b-home', capacity: 1 },
      ],
      [{ name: 'X', address: 'x' }],
      'dest',
      mapDistance,
    );

    // Old nearest-home greedy would pick Ana (5 < 8) for a total of 55 km;
    // cheapest insertion picks Beto (detour 8+20-30=-2) for a total of 38.
    expect(result.assignments).toEqual({ X: 'Beto' });
    expect(result.totalDistanceMeters).toBe(10 + 8 + 20);
  });
});

describe('generateMapUrl', () => {
  it('builds a driving directions link with encoded waypoints', () => {
    const url = generateMapUrl(['Calle Falsa 123', 'Av. Siempreviva 742', 'Obelisco']);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=Calle%20Falsa%20123&destination=Obelisco&waypoints=Av.%20Siempreviva%20742',
    );
  });

  it('omits the waypoints parameter for direct routes', () => {
    const url = generateMapUrl(['A', 'B']);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=A&destination=B',
    );
  });

  it('uses lat,lng coordinates when available (reliable + short)', () => {
    const coords = new Map([
      ['driver-home', { lat: -34.6037389, lon: -58.3815704 }],
      ['pickup', { lat: -34.6, lon: -58.4 }],
      ['Delta, Vivanco, Tigre', { lat: -34.4264, lon: -58.5797 }],
    ]);
    const url = generateMapUrl(['driver-home', 'pickup', 'Delta, Vivanco, Tigre'], coords);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=-34.60374,-58.38157&destination=-34.4264,-58.5797&waypoints=-34.6,-58.4',
    );
  });

  it('falls back to the text address when a point has no coordinates', () => {
    const coords = new Map([['A', { lat: -34.6, lon: -58.4 }]]);
    const url = generateMapUrl(['A', 'Some Place, City'], coords);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=-34.6,-58.4&destination=Some%20Place%2C%20City',
    );
  });
});
