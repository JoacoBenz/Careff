import { env } from './env';

/**
 * Suggests a current fuel price (Nafta Súper, per litre) from the Secretaría de
 * Energía open dataset — free, no API key. It's a best-effort convenience: the
 * data lags (~weekly) and the dataset resource id can change, so callers must
 * keep an editable fallback. Returns null on any problem.
 */

const ENERGIA_API_URL = env.ENERGIA_API_URL ?? 'https://datos.energia.gob.ar/api/3/action';
const RESOURCE = env.ENERGIA_FUEL_RESOURCE ?? '';

export interface FuelPriceSuggestion {
  price: number;
  asOf?: string;
}

// Cache suggestions for an hour (price barely moves day to day, and it keeps us
// light on the public dataset). Keyed by province.
const cache = new Map<string, { value: FuelPriceSuggestion | null; at: number }>();
const TTL_MS = 60 * 60 * 1000;

export async function suggestFuelPrice(provinceName?: string): Promise<FuelPriceSuggestion | null> {
  if (!RESOURCE) return null;
  const key = provinceName?.toLowerCase() ?? '';
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

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
