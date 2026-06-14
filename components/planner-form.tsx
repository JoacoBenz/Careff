'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { CarpoolPlanResult } from '@/lib/carpool';
import type { ApiErrorBody } from '@/types';
import { AddressInput } from './address-input';
import { PlanResultView } from './plan-result';
import { RouteLoading } from './route-loading';
import { RegionSelect, type RegionValue } from './region-select';
import { useRegion } from './use-region';

interface DriverRow {
  name: string;
  address: string;
  capacity: string;
  lat?: number;
  lon?: number;
}

interface PassengerRow {
  name: string;
  address: string;
  lat?: number;
  lon?: number;
}

type Coords = { lat: number; lon: number };

interface PlanResponse {
  plan: CarpoolPlanResult;
  saved: boolean;
  shareToken?: string;
}

// Field base WITHOUT a width, so width utilities (w-16/w-20) added per-field
// don't collide with w-full (Tailwind resolves conflicts by compiled order,
// not class-string order). inputClass is the full-width default.
const fieldBase =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';
const inputClass = `${fieldBase} w-full`;

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

export function PlannerForm({
  loggedIn,
  initialRegion,
}: {
  loggedIn: boolean;
  initialRegion?: RegionValue;
}) {
  const [region, setRegion] = useRegion(initialRegion);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<Coords | undefined>();
  const [drivers, setDrivers] = useState<DriverRow[]>([{ name: '', address: '', capacity: '3' }]);
  const [passengers, setPassengers] = useState<PassengerRow[]>([{ name: '', address: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);

  // Live seat budget: passengers can never outnumber the seats the drivers
  // bring, so the "+ Agregar pasajero" button locks when the cars are full.
  const totalSeats = drivers.reduce((sum, d) => sum + (Number(d.capacity) || 0), 0);
  const seatsFull = passengers.length >= totalSeats;
  const overCapacity = passengers.length > totalSeats;

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
      // Coordinates captured when a suggestion was picked, keyed by address.
      const coords: Record<string, Coords> = {};
      for (const d of drivers)
        if (d.lat != null && d.lon != null) coords[d.address] = { lat: d.lat, lon: d.lon };
      for (const p of passengers)
        if (p.lat != null && p.lon != null) coords[p.address] = { lat: p.lat, lon: p.lon };
      if (destinationCoords) coords[destination] = destinationCoords;

      const response = await fetch('/api/carpool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `Viaje a ${destination}`,
          destination,
          drivers: drivers.map((d) => ({
            name: d.name,
            address: d.address,
            capacity: Number(d.capacity),
          })),
          passengers: passengers.map((p) => ({ name: p.name, address: p.address })),
          coords: Object.keys(coords).length > 0 ? coords : undefined,
          country: region.country,
          provincia: region.provincia,
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
          <label className="block text-sm text-slate-600">
            Nombre del viaje (opcional)
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cumple de Martina"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <div className="mt-3 text-sm text-slate-600">
            Región (mejora la precisión de las direcciones)
            <div className="mt-1">
              <RegionSelect value={region} onChange={setRegion} />
            </div>
          </div>
          <label className="mt-3 block text-sm text-slate-600">
            Destino final
            <div className="mt-1">
              <AddressInput
                value={destination}
                onChange={(v, c) => {
                  setDestination(v);
                  setDestinationCoords(c);
                }}
                region={{ country: region.country, provincia: region.provincia }}
                placeholder="Av. Corrientes 1234, Buenos Aires"
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
              // Mobile: name + seats + remove on one line, address full-width
              // below. Desktop (sm): everything inline via order utilities.
              <div
                key={i}
                className="flex flex-wrap gap-2 rounded-lg bg-slate-50 p-2 sm:bg-transparent sm:p-0"
              >
                <input
                  value={driver.name}
                  onChange={(e) => updateDriver(i, { name: e.target.value })}
                  placeholder="Nombre"
                  required
                  className={`${inputClass} order-1 min-w-0 flex-1 sm:max-w-36`}
                />
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={driver.capacity}
                  onChange={(e) => updateDriver(i, { capacity: e.target.value })}
                  required
                  className={`${fieldBase} order-2 w-16 sm:order-3 sm:w-20`}
                  title="Asientos libres"
                  aria-label="Asientos libres"
                />
                <button
                  type="button"
                  onClick={() => setDrivers((rows) => rows.filter((_, j) => j !== i))}
                  disabled={drivers.length === 1}
                  className="order-3 rounded-lg border border-slate-300 px-3 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40 sm:order-4"
                  aria-label="Quitar conductor"
                >
                  ✕
                </button>
                <div className="order-4 w-full sm:order-2 sm:w-auto sm:flex-1">
                  <AddressInput
                    value={driver.address}
                    onChange={(v, c) => updateDriver(i, { address: v, lat: c?.lat, lon: c?.lon })}
                    region={{ country: region.country, provincia: region.provincia }}
                    placeholder="Dirección"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setDrivers((rows) => [...rows, { name: '', address: '', capacity: '3' }])
            }
            disabled={drivers.length >= 10}
            className="link-sweep mt-3 text-sm font-medium text-emerald-700 disabled:opacity-40"
          >
            + Agregar conductor
          </button>
        </SectionCard>

        <SectionCard
          step="3"
          title="Pasajeros"
          hint={`Quiénes necesitan que los pasen a buscar. Asientos: ${passengers.length}/${totalSeats}.`}
        >
          <div className="space-y-2">
            {passengers.map((passenger, i) => (
              <div
                key={i}
                className="flex flex-wrap gap-2 rounded-lg bg-slate-50 p-2 sm:bg-transparent sm:p-0"
              >
                <input
                  value={passenger.name}
                  onChange={(e) => updatePassenger(i, { name: e.target.value })}
                  placeholder="Nombre"
                  required
                  className={`${inputClass} order-1 min-w-0 flex-1 sm:max-w-36`}
                />
                <button
                  type="button"
                  onClick={() => setPassengers((rows) => rows.filter((_, j) => j !== i))}
                  disabled={passengers.length === 1}
                  className="order-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40 sm:order-3"
                  aria-label="Quitar pasajero"
                >
                  ✕
                </button>
                <div className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1">
                  <AddressInput
                    value={passenger.address}
                    onChange={(v, c) =>
                      updatePassenger(i, { address: v, lat: c?.lat, lon: c?.lon })
                    }
                    region={{ country: region.country, provincia: region.provincia }}
                    placeholder="Dirección"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPassengers((rows) => [...rows, { name: '', address: '' }])}
            disabled={passengers.length >= 30 || seatsFull}
            className="link-sweep mt-3 text-sm font-medium text-emerald-700 disabled:opacity-40"
          >
            + Agregar pasajero
          </button>
          {seatsFull && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
              🚗 Asientos completos ({totalSeats}). Para sumar más pasajeros, agregá otro conductor
              o aumentá los asientos libres.
            </p>
          )}
        </SectionCard>

        {overCapacity && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800" role="alert">
            Hay {passengers.length} pasajeros pero solo {totalSeats} asiento
            {totalSeats === 1 ? '' : 's'}. Quitá pasajeros o sumá asientos para poder calcular.
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || overCapacity}
          className="btn-glow w-full rounded-xl py-3 text-base disabled:opacity-50"
        >
          {loading ? 'Calculando rutas…' : '✨ Calcular distribución'}
        </button>
      </form>

      {result && (
        <section id="resultado" className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Resultado</h2>
          {!result.saved && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
              💾 Este plan no quedó guardado.{' '}
              <Link href="/register" className="link-sweep font-medium text-emerald-700">
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
