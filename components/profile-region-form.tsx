'use client';

import { useState } from 'react';
import { RegionSelect, type RegionValue } from './region-select';
import { CheckIcon, PinIcon } from './icons';

/**
 * Lets a registered user save their default region (country + province) so the
 * planner's address autocomplete starts scoped to where they live.
 */
export function ProfileRegionForm({ initial }: { initial: RegionValue }) {
  const [region, setRegion] = useState<RegionValue>(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function save() {
    setStatus('saving');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: region.country,
          provinceId: region.provincia,
          provinceName: region.provinceName,
        }),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="surface p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-semibold text-white">
        <PinIcon className="h-4 w-4 text-amber-300" />
        Mi región
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-dim)]">
        Elegí tu país y provincia. Las usamos para que el autocompletado de direcciones sea más
        preciso y no traiga calles de otras provincias.
      </p>
      <div className="mt-4">
        <RegionSelect
          value={region}
          onChange={(r) => {
            setRegion(r);
            setStatus('idle');
          }}
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === 'saving'}
          className="btn-glow rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {status === 'saving' ? 'Guardando…' : 'Guardar'}
        </button>
        {status === 'saved' && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-300" role="status">
            <CheckIcon className="h-4 w-4" /> Guardado
          </span>
        )}
        {status === 'error' && (
          <span className="text-sm text-rose-300" role="alert">
            No se pudo guardar, probá de nuevo.
          </span>
        )}
      </div>
    </div>
  );
}
