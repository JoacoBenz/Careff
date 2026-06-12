import { env } from './env';
import type { DistanceFn } from './carpool';

/**
 * Distance provider backed by free OpenStreetMap services — no API key and no
 * cost: Nominatim for geocoding and OSRM for driving distances. Both public
 * instances have fair-use policies (~1 req/s), which the request caps in
 * lib/validators.ts keep us comfortably under. Self-hosted instances can be
 * pointed at via NOMINATIM_URL / OSRM_URL.
 */

const NOMINATIM_URL = env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org';
const OSRM_URL = env.OSRM_URL ?? 'https://router.project-osrm.org';
const USER_AGENT = 'careff/0.1 (carpool planner; contact: see repository)';

export class AddressNotFoundError extends Error {
  constructor(public readonly address: string) {
    super(`Address not found: ${address}`);
    this.name = 'AddressNotFoundError';
  }
}

export class GeoProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeoProviderError';
  }
}

interface Coordinates {
  lat: number;
  lon: number;
}

export interface AddressSuggestion {
  label: string;
  lat: number;
  lon: number;
}

/** Autocomplete suggestions for the planner's address inputs. */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const url = `${NOMINATIM_URL}/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new GeoProviderError(`Geocoder responded with status ${response.status}`);
  }
  const results = (await response.json()) as { display_name?: string; lat: string; lon: string }[];
  if (!Array.isArray(results)) return [];
  return results.map((r) => ({
    label: r.display_name ?? '',
    lat: Number(r.lat),
    lon: Number(r.lon),
  }));
}

// Process-wide cache: repeated plans usually share addresses, and caching keeps
// us polite with the public Nominatim instance.
const geocodeCache = new Map<string, Coordinates>();

async function geocode(address: string): Promise<Coordinates> {
  const cached = geocodeCache.get(address);
  if (cached) return cached;

  const url = `${NOMINATIM_URL}/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new GeoProviderError(`Geocoder responded with status ${response.status}`);
  }
  const results = (await response.json()) as { lat: string; lon: string }[];
  if (!Array.isArray(results) || results.length === 0) {
    throw new AddressNotFoundError(address);
  }
  const coords = { lat: Number(results[0].lat), lon: Number(results[0].lon) };
  geocodeCache.set(address, coords);
  return coords;
}

/**
 * Geocodes every unique address and fetches a full driving-distance matrix in
 * a single OSRM table call. Returns a synchronous DistanceFn for planCarpool.
 */
export async function buildDistanceFn(addresses: string[]): Promise<DistanceFn> {
  const unique = [...new Set(addresses)];
  const coords: Coordinates[] = [];
  for (const address of unique) {
    coords.push(await geocode(address));
  }

  const pairs = coords.map((c) => `${c.lon},${c.lat}`).join(';');
  const url = `${OSRM_URL}/table/v1/driving/${pairs}?annotations=distance`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new GeoProviderError(`Routing service responded with status ${response.status}`);
  }
  const data = (await response.json()) as { code?: string; distances?: (number | null)[][] };
  if (data.code !== 'Ok' || !data.distances) {
    throw new GeoProviderError(`Routing service error: ${data.code ?? 'no distance matrix'}`);
  }

  const indexByAddress = new Map(unique.map((address, i) => [address, i]));
  const matrix = data.distances;

  return (from, to) => {
    const i = indexByAddress.get(from);
    const j = indexByAddress.get(to);
    if (i === undefined || j === undefined) {
      throw new GeoProviderError(
        `Unknown address in distance lookup: ${i === undefined ? from : to}`,
      );
    }
    const distance = matrix[i][j];
    if (distance === null || distance === undefined) {
      throw new GeoProviderError(`No driving route between "${from}" and "${to}"`);
    }
    return distance;
  };
}
