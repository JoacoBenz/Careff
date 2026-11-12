'use client';

import { useEffect, useRef, useState } from 'react';
import type { AddressSuggestion } from '@/lib/geo';
import { PinIcon } from './icons';

interface AddressInputProps {
  value: string;
  // coords are provided only when the value comes from picking a suggestion;
  // typing emits no coords so the parent clears any stale pin.
  onChange: (value: string, coords?: { lat: number; lon: number }) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  // Constrains suggestions to a country (Nominatim) / province (Georef).
  region?: { country?: string; provincia?: string };
  // True once the address has coordinates (picked from the list): shows a
  // small "located" mark so it's obvious which rows are on the preview map.
  located?: boolean;
  // Lets the parent point the preview map at this field when it gets focus.
  onFieldFocus?: () => void;
}

/**
 * Address field with debounced autocomplete backed by /api/geo/search.
 * Selecting a suggestion replaces the text with the geocoder's canonical
 * address and passes its exact coordinates up, so the plan request skips
 * re-geocoding that address.
 */
export function AddressInput({
  value,
  onChange,
  placeholder,
  required,
  className,
  region,
  located,
  onFieldFocus,
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      controller.current?.abort();
    };
  }, []);

  function handleChange(next: string) {
    onChange(next);
    if (timer.current) clearTimeout(timer.current);
    controller.current?.abort();
    if (next.trim().length < 4) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      controller.current = new AbortController();
      try {
        const params = new URLSearchParams({ q: next });
        if (region?.country) params.set('country', region.country);
        if (region?.provincia) params.set('prov', region.provincia);
        const response = await fetch(`/api/geo/search?${params.toString()}`, {
          signal: controller.current.signal,
        });
        if (!response.ok) return;
        const body = (await response.json()) as { suggestions: AddressSuggestion[] };
        setSuggestions(body.suggestions);
        setOpen(body.suggestions.length > 0);
      } catch {
        // Aborted or offline: keep the typed text — it still gets geocoded
        // server-side on submit.
      }
    }, 300);
  }

  return (
    <div className="relative w-full">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          setOpen(suggestions.length > 0);
          onFieldFocus?.();
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        required={required}
        className={located ? `${className ?? ''} pr-9` : className}
        autoComplete="off"
      />
      {located && (
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-300"
          title="Ubicada en el mapa"
        >
          <PinIcon className="h-4 w-4" />
          <span className="sr-only">Ubicada en el mapa</span>
        </span>
      )}
      {open && (
        <ul className="absolute z-30 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-[var(--line-strong)] bg-[#0b1220] p-1 shadow-2xl">
          {suggestions.map((s, i) => (
            // Labels are deduped server-side; index guards against any
            // remaining collision (Nominatim can repeat coordinates).
            <li key={`${i}-${s.label}`}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(s.label, { lat: s.lat, lon: s.lon });
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--ink)] hover:bg-amber-400/10"
              >
                <PinIcon className="mt-0.5 h-4 w-4 flex-none text-amber-300" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
