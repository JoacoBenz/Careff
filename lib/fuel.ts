import { env } from './env';

/**
 * Suggests a current fuel price (Nafta Súper, per litre) from the Secretaría de
 * Energía open dataset — free, no API key. It's a best-effort convenience: the
 * data lags (~weekly) and the dataset resource id can change, so callers must
 * keep an editable fallback. Returns null on any problem.
 */

const ENERGIA_API_URL = env.ENERGIA_API_URL ?? 'https://datos.energia.gob.ar/api/3/action';
const RESOURCE = env.ENERGIA_FUEL_RESOURCE ?? '';
// CKAN resource ids are UUIDs; refuse anything else so a misconfigured env can
// never break out of the quoted table identifier in the dataset query.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface FuelPriceSuggestion {
  price: number;
  asOf?: string;
}

// Cache suggestions for an hour (price barely moves day to day, and it keeps us
// light on the public dataset). Null (no data / outage) is cached only briefly
// so a transient failure doesn't suppress retries for a full hour. Keyed by
// province + resource id (so changing the resource invalidates stale entries).
const cache = new Map<string, { value: FuelPriceSuggestion | null; at: number }>();
const TTL_MS = 60 * 60 * 1000;
const NEG_TTL_MS = 5 * 60 * 1000;

export async function suggestFuelPrice(provinceName?: string): Promise<FuelPriceSuggestion | null> {
  if (!RESOURCE || !UUID_RE.test(RESOURCE)) return null;
  const key = `${RESOURCE}|${provinceName?.toLowerCase() ?? ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < (hit.value === null ? NEG_TTL_MS : TTL_MS)) return hit.value;

  // provinceName is charset-validated upstream (fuelPriceQuerySchema); the
  // quote-doubling is belt-and-suspenders for the dataset string literal.
  const provFilter = provinceName
    ? ` AND provincia ILIKE '%${provinceName.replace(/'/g, "''")}%'`
    : '';
  const sql = `SELECT AVG(precio) AS price, MAX(fecha_vigencia) AS as_of FROM "${RESOURCE}" WHERE producto ILIKE '%super%'${provFilter}`;

  let value: FuelPriceSuggestion | null = null;
  try {
    const url = `${ENERGIA_API_URL}/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        result?: { records?: { price?: string | number; as_of?: string }[] };
      };
      const row = data.result?.records?.[0];
      const price = row ? Number(row.price) : NaN;
      if (Number.isFinite(price) && price > 0) {
        value = { price: Math.round(price), asOf: row?.as_of };
      }
    }
  } catch {
    value = null; // network/parse problem — caller falls back to a default
  }

  cache.set(key, { value, at: Date.now() });
  return value;
}
