'use client';

import { useEffect, useRef, useState } from 'react';
import type { AddressSuggestion } from '@/lib/geo';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * Address field with debounced autocomplete backed by /api/geo/search.
 * Selecting a suggestion replaces the text with the geocoder's canonical
 * address, which guarantees the plan request will geocode.
 */
export function AddressInput({
  value,
  onChange,
  placeholder,
  required,
  className,
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
        const response = await fetch(`/api/geo/search?q=${encodeURIComponent(next)}`, {
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
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        required={required}
        className={className}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={`${s.lat},${s.lon}`}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(s.label);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
              >
                📍 {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
