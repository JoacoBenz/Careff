'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { seatBudget } from '@/lib/seat-budget';
import { AddressInput } from './address-input';
import { AddressMap, type MapPin } from './address-map';
import { PlanResultView } from './plan-result';
import { RouteLoading } from './route-loading';
import { RegionSelect, type RegionValue } from './region-select';
import { useRegion } from './use-region';
import { useOrigin } from './use-origin';
import { useCarpoolPlan } from './use-carpool-plan';
import { fieldBase, inputClass } from './form-styles';
import {
  AlertIcon,
  CarIcon,
  CloseIcon,
  FlagIcon,
  PlusIcon,
  SaveIcon,
  SparkIcon,
  UsersIcon,
} from './icons';

// Stable per-row id so React keys survive row removal (index keys would
// mis-associate each AddressInput's internal suggestion state on delete).
let rowSeq = 0;
const newRowId = () => `r${++rowSeq}`;

interface DriverRow {
  id: string;
  name: string;
  address: string;
  capacity: string;
  lat?: number;
  lon?: number;
}

interface PassengerRow {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lon?: number;
}

type Coords = { lat: number; lon: number };

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
    <section className="surface p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-amber-400/15 text-sm font-bold text-amber-300 ring-1 ring-amber-400/30">
          {step}
        </span>
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          {hint && <p className="text-xs text-[var(--ink-dim)]">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function AddRowButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-300 transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <PlusIcon className="h-4 w-4" />
      {children}
    </button>
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
  const origin = useOrigin();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<Coords | undefined>();
  const [drivers, setDrivers] = useState<DriverRow[]>([
    { id: newRowId(), name: '', address: '', capacity: '3' },
  ]);
  const [passengers, setPassengers] = useState<PassengerRow[]>([
    { id: newRowId(), name: '', address: '' },
  ]);
  const { loading, error, result, submit } = useCarpoolPlan();
  const resultRef = useRef<HTMLElement>(null);
  // Which pin the preview map zooms to (the address just picked or focused);
  // null shows every located address at once.
  const [mapFocus, setMapFocus] = useState<string | null>(null);
  // Phones: which field the inline map is open under (the side panel with
  // the big map is desktop-only). Separate from mapFocus so "Ver todos"
  // doesn't close it.
  const [inlineFor, setInlineFor] = useState<string | null>(null);

  // The result renders below a long form: bring it into view when it lands.
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  // Live seat budget: passengers can never outnumber the seats the drivers
  // bring, so the "+ Agregar pasajero" button locks when the cars are full.
  const { totalSeats, seatsFull, overCapacity } = seatBudget(
    drivers.map((d) => Number(d.capacity) || 0),
    passengers.length,
  );

  function updateDriver(index: number, patch: Partial<DriverRow>) {
    setDrivers((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updatePassenger(index: number, patch: Partial<PassengerRow>) {
    setPassengers((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Coordinates captured when a suggestion was picked, keyed by address.
    const coords: Record<string, Coords> = {};
    for (const d of drivers)
      if (d.lat != null && d.lon != null) coords[d.address] = { lat: d.lat, lon: d.lon };
    for (const p of passengers)
      if (p.lat != null && p.lon != null) coords[p.address] = { lat: p.lat, lon: p.lon };
    if (destinationCoords) coords[destination] = destinationCoords;

    await submit({
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
    });
  }

  // Every address that already has coordinates becomes a pin on the shared
  // preview map, so people can confirm it landed where they meant.
  const pins: MapPin[] = [];
  if (destinationCoords) {
    pins.push({ id: 'dest', label: 'Destino', kind: 'destination', ...destinationCoords });
  }
  for (const d of drivers) {
    if (d.lat != null && d.lon != null) {
      pins.push({ id: d.id, label: d.name || 'Conductor', kind: 'driver', lat: d.lat, lon: d.lon });
    }
  }
  for (const p of passengers) {
    if (p.lat != null && p.lon != null) {
      pins.push({
        id: p.id,
        label: p.name || 'Pasajero',
        kind: 'passenger',
        lat: p.lat,
        lon: p.lon,
      });
    }
  }
  const addressCount = 1 + drivers.length + passengers.length;

  /** Points the maps at a located address and opens the inline one there. */
  function showOnMap(id: string | null) {
    setMapFocus(id);
    setInlineFor(id);
  }

  // Phones only: the map opens right under the field being confirmed.
  const inlineMap = (id: string) =>
    inlineFor === id && pins.length > 0 ? (
      <div className="rise mt-2 lg:hidden">
        <AddressMap
          pins={pins}
          focusId={mapFocus}
          onShowAll={() => setMapFocus(null)}
          onClose={() => setInlineFor(null)}
          height={240}
        />
      </div>
    ) : null;
  const previewMap = (
    <>
      <AddressMap pins={pins} focusId={mapFocus} onShowAll={() => setMapFocus(null)} height={280} />
      {pins.length > 0 && pins.length < addressCount && (
        <p className="mt-1 text-[10px] text-[var(--ink-faint)]">
          {pins.length} de {addressCount} direcciones ubicadas. Las que escribas sin elegir de la
          lista se ubican al calcular.
        </p>
      )}
    </>
  );

  const driverCount = drivers.length;
  const passengerCount = passengers.length;
  const seatPct = totalSeats > 0 ? Math.min(100, (passengerCount / totalSeats) * 100) : 0;
  const submitLabel = loading ? 'Calculando rutas…' : 'Calcular distribución';

  return (
    <div className="space-y-8">
      {loading && <RouteLoading />}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form id="planner-form" onSubmit={onSubmit} className="space-y-4">
          <SectionCard step="1" title="El viaje" hint="Un nombre para reconocerlo y dónde termina.">
            <label className="block">
              <span className="field-label">Nombre del viaje (opcional)</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Cumple de Martina"
                className={inputClass}
              />
            </label>
            <div className="mt-4">
              <span className="field-label">Región (mejora la precisión de las direcciones)</span>
              <RegionSelect value={region} onChange={setRegion} />
            </div>
            <label className="mt-4 block">
              <span className="field-label">Destino final</span>
              <AddressInput
                value={destination}
                onChange={(v, c) => {
                  setDestination(v);
                  setDestinationCoords(c);
                  showOnMap(c ? 'dest' : null);
                }}
                located={Boolean(destinationCoords)}
                onFieldFocus={() => destinationCoords && showOnMap('dest')}
                region={{ country: region.country, provincia: region.provincia }}
                placeholder="Av. Corrientes 1234, Buenos Aires"
                required
                className={inputClass}
              />
            </label>
            {inlineMap('dest')}
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
                  key={driver.id}
                  className="surface-inset flex flex-wrap gap-2 p-2 sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <input
                    value={driver.name}
                    onChange={(e) => updateDriver(i, { name: e.target.value })}
                    placeholder="Nombre"
                    required
                    aria-label="Nombre del conductor"
                    className={`${inputClass} order-1 min-w-0 flex-1 sm:max-w-36`}
                  />
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={driver.capacity}
                    onChange={(e) => updateDriver(i, { capacity: e.target.value })}
                    required
                    className={`${fieldBase} order-2 w-16 text-center sm:order-3 sm:w-20`}
                    title="Asientos libres"
                    aria-label="Asientos libres"
                  />
                  <button
                    type="button"
                    onClick={() => setDrivers((rows) => rows.filter((_, j) => j !== i))}
                    disabled={drivers.length === 1}
                    className="btn-icon order-3 w-10 sm:order-4"
                    aria-label="Quitar conductor"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                  <div className="order-4 w-full sm:order-2 sm:w-auto sm:flex-1">
                    <AddressInput
                      value={driver.address}
                      onChange={(v, c) => {
                        updateDriver(i, { address: v, lat: c?.lat, lon: c?.lon });
                        showOnMap(c ? driver.id : null);
                      }}
                      located={driver.lat != null}
                      onFieldFocus={() => driver.lat != null && showOnMap(driver.id)}
                      region={{ country: region.country, provincia: region.provincia }}
                      placeholder="Dirección de salida"
                      required
                      className={inputClass}
                    />
                    {inlineMap(driver.id)}
                  </div>
                </div>
              ))}
            </div>
            <AddRowButton
              onClick={() =>
                setDrivers((rows) => [
                  ...rows,
                  { id: newRowId(), name: '', address: '', capacity: '3' },
                ])
              }
              disabled={drivers.length >= 10}
            >
              Agregar conductor
            </AddRowButton>
          </SectionCard>

          <SectionCard
            step="3"
            title="Pasajeros"
            hint={`Quiénes necesitan que los pasen a buscar. Asientos: ${passengers.length}/${totalSeats}.`}
          >
            <div className="space-y-2">
              {passengers.map((passenger, i) => (
                <div
                  key={passenger.id}
                  className="surface-inset flex flex-wrap gap-2 p-2 sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <input
                    value={passenger.name}
                    onChange={(e) => updatePassenger(i, { name: e.target.value })}
                    placeholder="Nombre"
                    required
                    aria-label="Nombre del pasajero"
                    className={`${inputClass} order-1 min-w-0 flex-1 sm:max-w-36`}
                  />
                  <button
                    type="button"
                    onClick={() => setPassengers((rows) => rows.filter((_, j) => j !== i))}
                    disabled={passengers.length === 1}
                    className="btn-icon order-2 w-10 sm:order-3"
                    aria-label="Quitar pasajero"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                  <div className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1">
                    <AddressInput
                      value={passenger.address}
                      onChange={(v, c) => {
                        updatePassenger(i, { address: v, lat: c?.lat, lon: c?.lon });
                        showOnMap(c ? passenger.id : null);
                      }}
                      located={passenger.lat != null}
                      onFieldFocus={() => passenger.lat != null && showOnMap(passenger.id)}
                      region={{ country: region.country, provincia: region.provincia }}
                      placeholder="Dirección donde lo buscan"
                      required
                      className={inputClass}
                    />
                    {inlineMap(passenger.id)}
                  </div>
                </div>
              ))}
            </div>
            <AddRowButton
              onClick={() =>
                setPassengers((rows) => [...rows, { id: newRowId(), name: '', address: '' }])
              }
              disabled={passengers.length >= 30 || seatsFull}
            >
              Agregar pasajero
            </AddRowButton>
            {seatsFull && !overCapacity && (
              <p className="note note-warn mt-2">
                Asientos completos ({totalSeats}). Para sumar más pasajeros, agregá otro conductor o
                aumentá los asientos libres.
              </p>
            )}
          </SectionCard>

          {overCapacity && (
            <p className="note note-warn flex gap-2" role="alert">
              <AlertIcon className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Hay {passengers.length} pasajeros pero solo {totalSeats} asiento
                {totalSeats === 1 ? '' : 's'}. Quitá pasajeros o sumá asientos para poder calcular.
              </span>
            </p>
          )}
          {error && (
            <p className="note note-error" role="alert">
              {error}
            </p>
          )}

          {/* Phones/tablets: the summary column is hidden, so the action lives
              here (the map opens inline under each located address). */}
          <button
            type="submit"
            disabled={loading || overCapacity}
            className="btn-glow w-full rounded-2xl py-3.5 text-base disabled:opacity-50 lg:hidden"
          >
            <SparkIcon className="h-5 w-5" />
            {submitLabel}
          </button>
        </form>

        {/* Desktop: live trip summary that follows the scroll. */}
        <aside className="surface sticky top-20 hidden p-5 lg:block">
          <p className="eyebrow">Tu viaje</p>
          <p className="mt-2 truncate text-lg font-semibold text-white">
            {title || (destination ? `Viaje a ${destination}` : 'Sin nombre todavía')}
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-[var(--ink-dim)]">
            <FlagIcon className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span className="line-clamp-2">{destination || 'Elegí el destino final'}</span>
          </p>

          <div className="mt-4">{previewMap}</div>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="surface-inset px-2 py-3">
              <dt className="flex items-center justify-center gap-1 text-xs text-[var(--ink-dim)]">
                <CarIcon className="h-3.5 w-3.5" /> Autos
              </dt>
              <dd className="mt-0.5 text-2xl font-bold tabular-nums text-white">{driverCount}</dd>
            </div>
            <div className="surface-inset px-2 py-3">
              <dt className="flex items-center justify-center gap-1 text-xs text-[var(--ink-dim)]">
                <UsersIcon className="h-3.5 w-3.5" /> Pasajeros
              </dt>
              <dd className="mt-0.5 text-2xl font-bold tabular-nums text-white">
                {passengerCount}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-[var(--ink-dim)]">Asientos ocupados</span>
              <span
                className={`font-semibold tabular-nums ${overCapacity ? 'text-rose-300' : 'text-white'}`}
              >
                {passengerCount}/{totalSeats}
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Asientos ocupados"
              aria-valuemin={0}
              aria-valuemax={totalSeats}
              aria-valuenow={Math.min(passengerCount, totalSeats)}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  overCapacity ? 'bg-rose-400' : 'bg-gradient-to-r from-amber-500 to-yellow-300'
                }`}
                style={{ width: `${overCapacity ? 100 : seatPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">
              {overCapacity
                ? 'Faltan asientos: sumá un conductor.'
                : seatsFull
                  ? 'Autos completos.'
                  : `Quedan ${totalSeats - passengerCount} asiento${totalSeats - passengerCount === 1 ? '' : 's'} libre${totalSeats - passengerCount === 1 ? '' : 's'}.`}
            </p>
          </div>

          <button
            type="submit"
            form="planner-form"
            disabled={loading || overCapacity}
            className="btn-glow mt-5 w-full rounded-2xl py-3 text-base disabled:opacity-50"
          >
            <SparkIcon className="h-5 w-5" />
            {submitLabel}
          </button>
          <p className="mt-3 text-center text-xs text-[var(--ink-faint)]">
            {loggedIn ? 'Se guarda solo en Mis planes.' : 'Sin registro. Gratis.'}
          </p>
        </aside>
      </div>

      {result && (
        <section id="resultado" ref={resultRef} className="rise scroll-mt-20 space-y-4">
          <div>
            <p className="eyebrow">Resultado</p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              {title || `Viaje a ${destination}`}
            </h2>
          </div>
          {!result.saved && (
            <p className="surface-dashed flex items-start gap-2.5 p-3.5 text-sm text-[var(--ink-dim)]">
              <SaveIcon className="mt-0.5 h-4 w-4 flex-none text-amber-300" />
              <span>
                Este plan no quedó guardado.{' '}
                <Link href="/register" className="link-sweep link-amber">
                  Creá una cuenta gratis
                </Link>{' '}
                para guardar tus planes y compartirlos con un link.
              </span>
            </p>
          )}
          <PlanResultView
            plan={result.plan}
            title={title || `Viaje a ${destination}`}
            regionName={region.provinceName}
            shareUrl={
              result.shareToken && loggedIn && origin
                ? `${origin}/p/${result.shareToken}`
                : undefined
            }
          />
        </section>
      )}
    </div>
  );
}
