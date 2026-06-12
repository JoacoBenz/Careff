'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { CarpoolPlanResult } from '@/lib/carpool';
import type { ApiErrorBody } from '@/types';
import { AddressInput } from './address-input';
import { PlanResultView } from './plan-result';
import { RouteLoading } from './route-loading';

interface DriverRow {
  name: string;
  address: string;
  capacity: string;
}

interface PassengerRow {
  name: string;
  address: string;
}

interface PlanResponse {
  plan: CarpoolPlanResult;
  saved: boolean;
  shareToken?: string;
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

function SectionCard({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {step}
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function PlannerForm({ loggedIn }: { loggedIn: boolean }) {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [destination, setDestination] = useState('');
  const [drivers, setDrivers] = useState<DriverRow[]>([{ name: '', address: '', capacity: '3' }]);
  const [passengers, setPassengers] = useState<PassengerRow[]>([{ name: '', address: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);

  function updateDriver(index: number, patch: Partial<DriverRow>) {
    setDrivers((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updatePassenger(index: number, patch: Partial<PassengerRow>) {
    setPassengers((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/carpool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `Viaje a ${destination}`,
          city: city || undefined,
          destination,
          drivers: drivers.map((d) => ({ ...d, capacity: Number(d.capacity) })),
          passengers,
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setError((body as ApiErrorBody).error.message);
        return;
      }
      setResult(body as PlanResponse);
    } catch {
      setError('No se pudo calcular el plan. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {loading && <RouteLoading />}
      <form onSubmit={onSubmit} className="space-y-4">
        <SectionCard step="1" title="El viaje" hint="Un nombre para reconocerlo y dónde termina.">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-slate-600">
              Nombre del viaje (opcional)
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Cumple de Martina"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block text-sm text-slate-600">
              Ciudad (se agrega a todas las direcciones)
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Buenos Aires, Argentina"
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          <label className="mt-3 block text-sm text-slate-600">
            Destino final
            <div className="mt-1">
              <AddressInput
                value={destination}
                onChange={setDestination}
                placeholder="Av. Corrientes 1234"
                required
                className={inputClass}
              />
            </div>
          </label>
        </SectionCard>

        <SectionCard
          step="2"
          title="Conductores"
          hint="Quiénes manejan, desde dónde salen y cuántos asientos libres tienen."
        >
          <div className="space-y-2">
            {drivers.map((driver, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={driver.name}
                  onChange={(e) => updateDriver(i, { name: e.target.value })}
                  placeholder="Nombre"
                  required
                  className={`${inputClass} max-w-36`}
                />
                <AddressInput
                  value={driver.address}
                  onChange={(v) => updateDriver(i, { address: v })}
                  placeholder="Dirección"
                  required
                  className={inputClass}
                />
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={driver.capacity}
                  onChange={(e) => updateDriver(i, { capacity: e.target.value })}
                  required
                  className={`${inputClass} w-20`}
                  title="Asientos libres"
                  aria-label="Asientos libres"
                />
                <button
                  type="button"
                  onClick={() => setDrivers((rows) => rows.filter((_, j) => j !== i))}
                  disabled={drivers.length === 1}
                  className="rounded-lg border border-slate-300 px-3 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Quitar conductor"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setDrivers((rows) => [...rows, { name: '', address: '', capacity: '3' }])
            }
            disabled={drivers.length >= 10}
            className="mt-3 text-sm font-medium text-emerald-700 hover:underline disabled:opacity-40"
          >
            + Agregar conductor
          </button>
        </SectionCard>

        <SectionCard step="3" title="Pasajeros" hint="Quiénes necesitan que los pasen a buscar.">
          <div className="space-y-2">
            {passengers.map((passenger, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={passenger.name}
                  onChange={(e) => updatePassenger(i, { name: e.target.value })}
                  placeholder="Nombre"
                  required
                  className={`${inputClass} max-w-36`}
                />
                <AddressInput
                  value={passenger.address}
                  onChange={(v) => updatePassenger(i, { address: v })}
                  placeholder="Dirección"
                  required
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setPassengers((rows) => rows.filter((_, j) => j !== i))}
                  disabled={passengers.length === 1}
                  className="rounded-lg border border-slate-300 px-3 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Quitar pasajero"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPassengers((rows) => [...rows, { name: '', address: '' }])}
            disabled={passengers.length >= 30}
            className="mt-3 text-sm font-medium text-emerald-700 hover:underline disabled:opacity-40"
          >
            + Agregar pasajero
          </button>
        </SectionCard>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Calculando rutas…' : '✨ Calcular distribución'}
        </button>
      </form>

      {result && (
        <section id="resultado" className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Resultado</h2>
          {!result.saved && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
              💾 Este plan no quedó guardado.{' '}
              <Link href="/register" className="font-medium text-emerald-700 underline">
                Creá una cuenta gratis
              </Link>{' '}
              para guardar tus planes y compartirlos con un link.
            </p>
          )}
          <PlanResultView
            plan={result.plan}
            title={title || `Viaje a ${destination}`}
            shareUrl={
              result.shareToken && loggedIn && typeof window !== 'undefined'
                ? `${window.location.origin}/p/${result.shareToken}`
                : undefined
            }
          />
        </section>
      )}
    </div>
  );
}
