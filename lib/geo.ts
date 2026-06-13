import { env } from './env';
import type { DistanceFn } from './carpool';

/**
 * Geocoding + driving distances, all on free services (no API key, no cost):
 *
 * - Geocoding (address -> coordinates): Georef, the Argentine government
 *   geocoder, is tried first (house-number precision for AR addresses).
 *   Nominatim (OpenStreetMap) is the fallback for POIs and addresses outside
 *   Argentina, where Georef returns nothing.
 * - Driving distances: a single OSRM `table` call per plan.
 *
 * Provider URLs are overridable via GEOREF_URL / NOMINATIM_URL / OSRM_URL.
 * Per-plan volume is tiny (<= ~41 lookups, most skipped via coordinate hints),
 * and autocomplete is debounced + cached, so the public instances' fair-use
 * limits are never a concern at this scale.
 */

const GEOREF_URL = env.GEOREF_URL ?? 'https://apis.datos.gob.ar/georef/api';
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

// ---------------------------------------------------------------------------
// Georef (primary)
// ---------------------------------------------------------------------------

interface GeorefDireccion {
  nomenclatura?: string;
  ubicacion?: { lat: number | null; lon: number | null };
}

async function georefSearch(query: string, max: number): Promise<AddressSuggestion[]> {
  const url = `${GEOREF_URL}/direcciones?direccion=${encodeURIComponent(query)}&max=${max}&campos=estandar`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new GeoProviderError(`Georef responded with status ${response.status}`);
  }
  const data = (await response.json()) as { direcciones?: GeorefDireccion[] };
  const suggestions: AddressSuggestion[] = [];
  for (const d of data.direcciones ?? []) {
    const lat = d.ubicacion?.lat;
    const lon = d.ubicacion?.lon;
    if (typeof lat === 'number' && typeof lon === 'number' && d.nomenclatura) {
      suggestions.push({ label: d.nomenclatura, lat, lon });
    }
  }
  return suggestions;
}

// ---------------------------------------------------------------------------
// Nominatim (fallback)
// ---------------------------------------------------------------------------

async function nominatimSearch(query: string, limit: number): Promise<AddressSuggestion[]> {
  const url = `${NOMINATIM_URL}/search?format=json&limit=${limit}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new GeoProviderError(`Geocoder responded with status ${response.status}`);
  }
  const results = (await response.json()) as { display_name?: string; lat: string; lon: string }[];
  if (!Array.isArray(results)) return [];
  // Nominatim can return the same place twice (e.g. as node and as way);
  // dedupe by label so the dropdown never shows identical entries.
  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];
  for (const r of results) {
    const label = r.display_name ?? '';
    if (label.length === 0 || seen.has(label)) continue;
    seen.add(label);
    suggestions.push({ label, lat: Number(r.lat), lon: Number(r.lon) });
  }
  return suggestions;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Autocomplete suggestions: Georef first, Nominatim if Georef has nothing. */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const ar = await georefSearch(query, 5).catch(() => [] as AddressSuggestion[]);
  if (ar.length > 0) return ar;
  return nominatimSearch(query, 5);
}

// Process-wide cache: repeated plans usually share addresses, and caching keeps
// us polite with the public geocoders.
const geocodeCache = new Map<string, Coordinates>();

async function geocode(address: string): Promise<Coordinates> {
  const cached = geocodeCache.get(address);
  if (cached) return cached;

  // Georef (Argentina, precise) first.
  const ar = await georefSearch(address, 1).catch(() => [] as AddressSuggestion[]);
  let coords: Coordinates | null = ar.length > 0 ? { lat: ar[0].lat, lon: ar[0].lon } : null;

  // Fallback to Nominatim for POIs / outside Argentina.
  if (!coords) {
    const osm = await nominatimSearch(address, 1).catch(() => [] as AddressSuggestion[]);
    if (osm.length > 0) coords = { lat: osm[0].lat, lon: osm[0].lon };
  }

  if (!coords) throw new AddressNotFoundError(address);
  geocodeCache.set(address, coords);
  return coords;
}

/**
 * Geocodes every unique address and fetches a full driving-distance matrix in
 * a single OSRM table call. `hints` supplies coordinates already known from the
 * autocomplete pick, so those addresses skip geocoding entirely (faster and
 * exact — no re-geocoding drift).
 */
export async function buildDistanceFn(
  addresses: string[],
  hints?: Map<string, Coordinates>,
): Promise<DistanceFn> {
  const unique = [...new Set(addresses)];
  const coords: Coordinates[] = [];
  for (const address of unique) {
    const hint = hints?.get(address);
    coords.push(hint ?? (await geocode(address)));
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
