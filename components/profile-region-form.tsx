'use client';

import { useState } from 'react';
import { RegionSelect, type RegionValue } from './region-select';

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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Mi región</h2>
      <p className="mt-1 text-sm text-slate-500">
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
          className="btn-glow rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {status === 'saving' ? 'Guardando…' : 'Guardar'}
        </button>
        {status === 'saved' && <span className="text-sm text-emerald-700">✓ Guardado</span>}
        {status === 'error' && (
          <span className="text-sm text-red-700">No se pudo guardar, probá de nuevo.</span>
        )}
      </div>
    </div>
  );
}
