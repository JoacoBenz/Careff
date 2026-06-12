'use client';

import { useState, type FormEvent } from 'react';
import type { CarpoolPlanResult } from '@/lib/carpool';
import type { ApiErrorBody } from '@/types';

interface DriverRow {
  name: string;
  address: string;
  capacity: string;
}

interface PassengerRow {
  name: string;
  address: string;
}

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm';

export function PlanResultView({ plan }: { plan: CarpoolPlanResult }) {
  return (
    <div className="space-y-4">
      {plan.unassigned.length > 0 && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800" role="alert">
          Sin lugar en ningún auto: {plan.unassigned.join(', ')}
        </p>
      )}
      <ul className="space-y-3">
        {plan.routes.map((route) => (
          <li key={route.driver} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">🚗 {route.driver}</h3>
              <span className="text-sm text-gray-500">
                {(route.distanceMeters / 1000).toFixed(1)} km
              </span>
            </div>
            <ol className="mt-2 list-inside list-decimal text-sm text-gray-700">
              {route.stops.map((stop) => (
                <li key={stop.name}>
                  Buscar a <strong>{stop.name}</strong> — {stop.address}
                </li>
              ))}
              <li>Destino — {route.addresses[route.addresses.length - 1]}</li>
            </ol>
            <a
              href={route.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 underline"
            >
              Ver ruta en Google Maps
            </a>
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium text-gray-600">
        Distancia total del plan: {(plan.totalDistanceMeters / 1000).toFixed(1)} km
      </p>
    </div>
  );
}

export function PlannerForm() {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [destination, setDestination] = useState('');
  const [drivers, setDrivers] = useState<DriverRow[]>([{ name: '', address: '', capacity: '3' }]);
  const [passengers, setPassengers] = useState<PassengerRow[]>([{ name: '', address: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<CarpoolPlanResult | null>(null);

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
    setPlan(null);
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
      setPlan((body as { plan: CarpoolPlanResult }).plan);
    } catch {
      setError('No se pudo calcular el plan. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Nombre del viaje (opcional)
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cumple de Martina"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-sm">
            Ciudad (se agrega a todas las direcciones)
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Buenos Aires, Argentina"
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Conductores</h2>
          <div className="space-y-2">
            {drivers.map((driver, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={driver.name}
                  onChange={(e) => updateDriver(i, { name: e.target.value })}
                  placeholder="Nombre"
                  required
                  className={inputClass}
                />
                <input
                  value={driver.address}
                  onChange={(e) => updateDriver(i, { address: e.target.value })}
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
                  placeholder="Asientos"
                  required
                  className="w-24 rounded border border-gray-300 px-3 py-2 text-sm"
                  title="Asientos libres"
                />
                <button
                  type="button"
                  onClick={() => setDrivers((rows) => rows.filter((_, j) => j !== i))}
                  disabled={drivers.length === 1}
                  className="rounded border border-gray-300 px-3 text-sm disabled:opacity-40"
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
            className="mt-2 text-sm underline disabled:opacity-40"
          >
            + Agregar conductor
          </button>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Pasajeros</h2>
          <div className="space-y-2">
            {passengers.map((passenger, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={passenger.name}
                  onChange={(e) => updatePassenger(i, { name: e.target.value })}
                  placeholder="Nombre"
                  required
                  className={inputClass}
                />
                <input
                  value={passenger.address}
                  onChange={(e) => updatePassenger(i, { address: e.target.value })}
                  placeholder="Dirección"
                  required
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setPassengers((rows) => rows.filter((_, j) => j !== i))}
                  disabled={passengers.length === 1}
                  className="rounded border border-gray-300 px-3 text-sm disabled:opacity-40"
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
            className="mt-2 text-sm underline disabled:opacity-40"
          >
            + Agregar pasajero
          </button>
        </section>

        <section>
          <label className="block text-sm font-semibold">
            Destino final
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Av. Corrientes 1234"
              required
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </section>

        {error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-2.5 text-white disabled:opacity-50"
        >
          {loading ? 'Calculando rutas…' : 'Calcular distribución'}
        </button>
      </form>

      {plan && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Resultado</h2>
          <PlanResultView plan={plan} />
        </section>
      )}
    </div>
  );
}
