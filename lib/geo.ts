import { env } from './env';
import type { DistanceFn } from './carpool';
import { prettyLabel } from './address-format';

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

export interface Province {
  id: string;
  nombre: string;
}

/** Region constraint for geocoding. country is an ISO-3166 alpha-2 code. */
export interface Region {
  country?: string;
  provincia?: string;
}

// ---------------------------------------------------------------------------
// Georef (primary)
// ---------------------------------------------------------------------------

interface GeorefDireccion {
  nomenclatura?: string;
  ubicacion?: { lat: number | null; lon: number | null };
}

async function georefSearch(
  query: string,
  max: number,
  provincia?: string,
): Promise<AddressSuggestion[]> {
  const prov = provincia ? `&provincia=${encodeURIComponent(provincia)}` : '';
  const url = `${GEOREF_URL}/direcciones?direccion=${encodeURIComponent(query)}&max=${max}${prov}&campos=estandar`;
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
      suggestions.push({ label: prettyLabel(d.nomenclatura), lat, lon });
    }
  }
  return suggestions;
}

/** Province of a coordinate (used to auto-default the region from geolocation). */
export async function reverseProvince(lat: number, lon: number): Promise<Province | null> {
  const url = `${GEOREF_URL}/ubicacion?lat=${lat}&lon=${lon}&campos=estandar`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as {
    ubicacion?: { provincia?: { id?: string; nombre?: string } };
  };
  const p = data.ubicacion?.provincia;
  return p?.id && p?.nombre ? { id: p.id, nombre: p.nombre } : null;
}

/** All Argentine provinces, for the manual region selector. */
export async function listProvinces(): Promise<Province[]> {
  const url = `${GEOREF_URL}/provincias?campos=id,nombre&max=30`;
  const response = await fetch(url);
  if (!response.ok) throw new GeoProviderError(`Georef responded with status ${response.status}`);
  const data = (await response.json()) as { provincias?: { id: string; nombre: string }[] };
  return (data.provincias ?? [])
    .map((p) => ({ id: p.id, nombre: p.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// ---------------------------------------------------------------------------
// Nominatim (fallback)
// ---------------------------------------------------------------------------

async function nominatimSearch(
  query: string,
  limit: number,
  country = 'ar',
): Promise<AddressSuggestion[]> {
  // countrycodes keeps the fallback within the selected country.
  const cc = encodeURIComponent(country.toLowerCase());
  const url = `${NOMINATIM_URL}/search?format=json&countrycodes=${cc}&limit=${limit}&q=${encodeURIComponent(query)}`;
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
    const lat = Number(r.lat);
    const lon = Number(r.lon);
    // Guard against malformed coords (parity with the Georef branch): a NaN
    // would otherwise silently poison the OSRM distance matrix.
    if (label.length === 0 || seen.has(label) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }
    seen.add(label);
    suggestions.push({ label, lat, lon });
  }
  return suggestions;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Georef only covers Argentina, so it's used when the country is AR (the
// default); other countries go straight to Nominatim scoped to that country.
function isArgentina(region?: Region): boolean {
  const c = region?.country?.toLowerCase();
  return !c || c === 'ar';
}

/**
 * Autocomplete suggestions. In Argentina: Georef (constrained to the province,
 * which removes same-named streets elsewhere) first, then Nominatim(AR). In
 * other countries: Nominatim scoped to that country.
 */
export async function searchAddresses(
  query: string,
  region?: Region,
): Promise<AddressSuggestion[]> {
  const country = region?.country?.toLowerCase() || 'ar';
  if (isArgentina(region)) {
    const ar = await georefSearch(query, 5, region?.provincia).catch(
      () => [] as AddressSuggestion[],
    );
    if (ar.length > 0) return ar;
  }
  return nominatimSearch(query, 5, country);
}

// Process-wide cache: repeated plans usually share addresses, and caching keeps
// us polite with the public geocoders. Keyed by region + address.
const geocodeCache = new Map<string, Coordinates>();

async function geocode(address: string, region?: Region): Promise<Coordinates> {
  const country = region?.country?.toLowerCase() || 'ar';
  const cacheKey = `${country}|${region?.provincia ?? ''}|${address}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  let coords: Coordinates | null = null;

  // Georef (Argentina, precise, province-constrained) first.
  if (isArgentina(region)) {
    const ar = await georefSearch(address, 1, region?.provincia).catch(
      () => [] as AddressSuggestion[],
    );
    if (ar.length > 0) coords = { lat: ar[0].lat, lon: ar[0].lon };
  }

  // Fallback to Nominatim, scoped to the country.
  if (!coords) {
    const osm = await nominatimSearch(address, 1, country).catch(() => [] as AddressSuggestion[]);
    if (osm.length > 0) coords = { lat: osm[0].lat, lon: osm[0].lon };
  }

  if (!coords) throw new AddressNotFoundError(address);
  geocodeCache.set(cacheKey, coords);
  return coords;
}

/** Driving-distance lookup plus the coordinates resolved for each address. */
export interface DistanceData {
  distance: DistanceFn;
  /** Address -> coordinates, for building precise map links downstream. */
  coordsByAddress: Map<string, Coordinates>;
}

/**
 * Geocodes every unique address and fetches a full driving-distance matrix in
 * a single OSRM table call. `hints` supplies coordinates already known from the
 * autocomplete pick (skip geocoding — faster and exact). `region` constrains
 * any address that still needs geocoding to the trip's country / province.
 *
 * Returns both the distance function and the resolved coordinates, so callers
 * can build "lat,lng" map links (which Google Maps resolves reliably) instead
 * of re-geocoding verbose text addresses.
 */
export async function buildDistanceFn(
  addresses: string[],
  hints?: Map<string, Coordinates>,
  region?: Region,
): Promise<DistanceData> {
  const unique = [...new Set(addresses)];
  const coords: Coordinates[] = [];
  for (const address of unique) {
    const hint = hints?.get(address);
    coords.push(hint ?? (await geocode(address, region)));
  }
  const coordsByAddress = new Map(unique.map((address, i) => [address, coords[i]]));

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

  const distance: DistanceFn = (from, to) => {
    const i = indexByAddress.get(from);
    const j = indexByAddress.get(to);
    if (i === undefined || j === undefined) {
      throw new GeoProviderError(
        `Unknown address in distance lookup: ${i === undefined ? from : to}`,
      );
    }
    const d = matrix[i][j];
    if (d === null || d === undefined) {
      throw new GeoProviderError(`No driving route between "${from}" and "${to}"`);
    }
    return d;
  };

  return { distance, coordsByAddress };
}
