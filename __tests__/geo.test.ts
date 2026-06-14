import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchAddresses, buildDistanceFn, AddressNotFoundError } from '@/lib/geo';

// geo.ts talks to Georef / Nominatim / OSRM over fetch; stub it per test.
const jsonRes = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

type Routes = { georef?: unknown; nominatim?: unknown; osrm?: unknown };

function stubFetch(routes: Routes) {
  const mock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/direcciones')) return jsonRes(routes.georef ?? { direcciones: [] });
    if (url.includes('/search')) return jsonRes(routes.nominatim ?? []);
    if (url.includes('/table/v1/driving')) return jsonRes(routes.osrm ?? { code: 'Ok' });
    return new Response('not found', { status: 404 });
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('searchAddresses', () => {
  it('returns Georef hits (title-cased) for Argentina', async () => {
    stubFetch({
      georef: {
        direcciones: [
          { nomenclatura: 'AVENIDA CORRIENTES 1234', ubicacion: { lat: -34.6, lon: -58.4 } },
        ],
      },
    });
    const res = await searchAddresses('corrientes 1234');
    expect(res).toHaveLength(1);
    expect(res[0].label).toBe('Avenida Corrientes 1234');
    expect(res[0].lat).toBe(-34.6);
  });

  it('falls back to Nominatim when Georef returns nothing', async () => {
    stubFetch({
      georef: { direcciones: [] },
      nominatim: [{ display_name: 'Calle X, CABA', lat: '-34.6', lon: '-58.4' }],
    });
    const res = await searchAddresses('algo raro');
    expect(res[0].label).toBe('Calle X, CABA');
  });

  it('drops Nominatim results with non-finite coordinates', async () => {
    stubFetch({
      georef: { direcciones: [] },
      nominatim: [
        { display_name: 'Bad', lat: 'abc', lon: '-58.4' },
        { display_name: 'Good', lat: '-34.6', lon: '-58.4' },
      ],
    });
    const res = await searchAddresses('mixto');
    expect(res.map((r) => r.label)).toEqual(['Good']);
  });
});

describe('buildDistanceFn', () => {
  it('builds the matrix from hints and exposes coordinates', async () => {
    stubFetch({
      osrm: {
        code: 'Ok',
        distances: [
          [0, 1500],
          [1500, 0],
        ],
      },
    });
    const hints = new Map([
      ['A', { lat: 0, lon: 0 }],
      ['B', { lat: 0, lon: 1 }],
    ]);
    const { distance, coordsByAddress } = await buildDistanceFn(['A', 'B'], hints);
    expect(distance('A', 'B')).toBe(1500);
    expect(distance('B', 'A')).toBe(1500);
    expect(coordsByAddress.get('A')).toEqual({ lat: 0, lon: 0 });
  });

  it('throws AddressNotFoundError when nothing geocodes', async () => {
    stubFetch({ georef: { direcciones: [] }, nominatim: [] });
    await expect(buildDistanceFn(['Calle Inexistente 999'])).rejects.toBeInstanceOf(
      AddressNotFoundError,
    );
  });
});
