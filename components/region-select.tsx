'use client';

import { useEffect, useRef, useState } from 'react';
import type { Province } from '@/lib/geo';

export interface RegionValue {
  country: string;
  provincia?: string;
  provinceName?: string;
}

// Georef gives province-level precision only for Argentina; other countries
// fall back to country-scoped Nominatim search (no province sub-filter).
const COUNTRIES = [
  { code: 'ar', name: 'Argentina' },
  { code: 'uy', name: 'Uruguay' },
  { code: 'cl', name: 'Chile' },
  { code: 'py', name: 'Paraguay' },
  { code: 'bo', name: 'Bolivia' },
  { code: 'br', name: 'Brasil' },
  { code: 'mx', name: 'México' },
  { code: 'es', name: 'España' },
];

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

/**
 * Country + province picker that scopes address autocomplete to a region (so
 * "San Martín 1234" stops matching a town in another province). When in
 * Argentina with no province chosen yet, it defaults to the user's province via
 * geolocation; a manual pick always wins.
 */
export function RegionSelect({
  value,
  onChange,
}: {
  value: RegionValue;
  onChange: (region: RegionValue) => void;
}) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [autoNote, setAutoNote] = useState<string | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    // Province dropdown only renders for Argentina; no need to clear otherwise.
    if (value.country !== 'ar') return;
    let active = true;
    fetch('/api/geo/provincias')
      .then((r) => r.json())
      .then((d: { provinces?: Province[] }) => {
        if (active) setProvinces(d.provinces ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value.country]);

  useEffect(() => {
    if (value.provincia || value.country !== 'ar' || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (touched.current) return;
        try {
          const r = await fetch(
            `/api/geo/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const d = (await r.json()) as { province?: Province | null };
          if (d.province && !touched.current) {
            onChange({ country: 'ar', provincia: d.province.id, provinceName: d.province.nombre });
            setAutoNote(`📍 ${d.province.nombre} (detectada por tu ubicación)`);
          }
        } catch {
          // ignore — stays manual
        }
      },
      () => {},
      { timeout: 8000, maximumAge: 600000 },
    );
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label="País"
        value={value.country}
        className={selectClass}
        onChange={(e) => {
          touched.current = true;
          setAutoNote(null);
          onChange({ country: e.target.value, provincia: undefined, provinceName: undefined });
        }}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      {value.country === 'ar' && (
        <select
          aria-label="Provincia"
          value={value.provincia ?? ''}
          className={`${selectClass} min-w-0 flex-1`}
          onChange={(e) => {
            touched.current = true;
            setAutoNote(null);
            const p = provinces.find((x) => x.id === e.target.value);
            onChange({
              country: 'ar',
              provincia: e.target.value || undefined,
              provinceName: p?.nombre,
            });
          }}
        >
          <option value="">Toda Argentina</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      )}
      {autoNote && <p className="w-full text-xs text-emerald-700">{autoNote}</p>}
    </div>
  );
}
