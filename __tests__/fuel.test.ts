import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const UUID = '00000000-0000-0000-0000-000000000000';

const jsonRes = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('suggestFuelPrice', () => {
  it('returns a rounded price + asOf for a valid resource', async () => {
    vi.stubEnv('ENERGIA_FUEL_RESOURCE', UUID);
    const fetchMock = vi.fn(async () =>
      jsonRes({ result: { records: [{ price: '1200.4', as_of: '2026-06-01' }] } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { suggestFuelPrice } = await import('@/lib/fuel');
    expect(await suggestFuelPrice()).toEqual({ price: 1200, asOf: '2026-06-01' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('refuses a non-UUID resource id without making a request', async () => {
    vi.stubEnv('ENERGIA_FUEL_RESOURCE', 'not-a-uuid');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { suggestFuelPrice } = await import('@/lib/fuel');
    expect(await suggestFuelPrice()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('caches by province so a repeated call does not refetch', async () => {
    vi.stubEnv('ENERGIA_FUEL_RESOURCE', UUID);
    const fetchMock = vi.fn(async () =>
      jsonRes({ result: { records: [{ price: '1000', as_of: '2026-06-01' }] } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { suggestFuelPrice } = await import('@/lib/fuel');
    await suggestFuelPrice('Córdoba');
    await suggestFuelPrice('Córdoba');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('returns null when the dataset has no usable rows', async () => {
    vi.stubEnv('ENERGIA_FUEL_RESOURCE', UUID);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonRes({ result: { records: [] } })),
    );
    const { suggestFuelPrice } = await import('@/lib/fuel');
    expect(await suggestFuelPrice()).toBeNull();
  });
});
