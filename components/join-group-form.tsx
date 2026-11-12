'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { ApiErrorBody } from '@/types';
import { AddressInput } from './address-input';
import { AddressMap } from './address-map';
import { RegionSelect, type RegionValue } from './region-select';
import { useRegion } from './use-region';
import { fieldBase, inputClass } from './form-styles';
import { CarIcon, CheckIcon, UserIcon } from './icons';

export interface JoinFormInitial {
  name?: string;
  address?: string;
  hasCar?: boolean;
  seats?: number;
}

export function JoinGroupForm({
  token,
  groupName,
  initial,
  initialRegion,
}: {
  token: string;
  groupName: string;
  initial?: JoinFormInitial;
  initialRegion?: RegionValue;
}) {
  const [region, setRegion] = useRegion(initialRegion);
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | undefined>();
  const [hasCar, setHasCar] = useState(initial?.hasCar ?? false);
  const [seats, setSeats] = useState(initial?.seats ? String(initial.seats) : '3');
  const prefilledAddress = Boolean(initial?.address);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  // Drivers must declare at least one free seat (mirrors the server refine).
  const seatsInvalid = hasCar && (seats.trim() === '' || Number(seats) < 1);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          address,
          hasCar,
          seats: hasCar ? Number(seats) : 0,
          lat: coords?.lat,
          lon: coords?.lon,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as ApiErrorBody;
        setError(body.error.message);
        return;
      }
      setJoined(true);
    } catch {
      setError('No se pudo enviar. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return (
      <div className="surface rise p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40">
          <CheckIcon className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-white">
          ¡Listo, {name}! Ya estás en «{groupName}»
        </h2>
        <p className="mt-1.5 text-sm text-[var(--ink-dim)]">
          {hasCar
            ? `Quedaste como conductor con ${seats} asiento${Number(seats) === 1 ? '' : 's'} libre${Number(seats) === 1 ? '' : 's'}.`
            : 'Cuando se arme el viaje, un auto te pasa a buscar.'}
        </p>
        <p className="mt-5 border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-dim)]">
          ¿Organizás salidas vos también?{' '}
          <Link href="/register" className="link-sweep link-amber">
            Creá tu grupo gratis
          </Link>
        </p>
      </div>
    );
  }

  const choice = (active: boolean) =>
    `flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-400 ${
      active
        ? 'border-amber-400/60 bg-amber-400/10 text-white'
        : 'border-[var(--line-strong)] text-[var(--ink-dim)] hover:border-slate-500'
    }`;

  return (
    <form onSubmit={onSubmit} className="surface space-y-4 p-5 sm:p-6">
      <label className="block">
        <span className="field-label">Tu nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          required
          maxLength={80}
          className={inputClass}
        />
      </label>
      <div>
        <span className="field-label">Tu región</span>
        <RegionSelect value={region} onChange={setRegion} />
      </div>
      <label className="block">
        <span className="field-label">Tu dirección (desde dónde salís)</span>
        <AddressInput
          value={address}
          onChange={(v, c) => {
            setAddress(v);
            setCoords(c);
          }}
          region={{ country: region.country, provincia: region.provincia }}
          placeholder="Av. Rivadavia 5000, Buenos Aires"
          required
          className={inputClass}
          located={Boolean(coords)}
        />
        {prefilledAddress && (
          <span className="mt-1.5 flex items-center gap-1 text-xs text-emerald-300">
            <CheckIcon className="h-3.5 w-3.5" />
            Usamos tu dirección guardada — podés cambiarla si salís desde otro lado.
          </span>
        )}
      </label>

      {coords && (
        <AddressMap
          pins={[
            { id: 'me', label: name || 'Vos', kind: hasCar ? 'driver' : 'passenger', ...coords },
          ]}
          focusId="me"
          height={170}
        />
      )}

      <fieldset>
        <legend className="field-label">¿Tenés auto?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={choice(hasCar)}>
            <input
              type="radio"
              name="hasCar"
              checked={hasCar}
              onChange={() => setHasCar(true)}
              className="sr-only"
            />
            <CarIcon className="h-5 w-5 flex-none text-amber-300" />
            Sí, llevo gente
          </label>
          <label className={choice(!hasCar)}>
            <input
              type="radio"
              name="hasCar"
              checked={!hasCar}
              onChange={() => setHasCar(false)}
              className="sr-only"
            />
            <UserIcon className="h-5 w-5 flex-none text-amber-300" />
            No, necesito que me lleven
          </label>
        </div>
        {hasCar && (
          <label className="mt-3 block">
            <span className="field-label">Asientos libres (sin contarte a vos)</span>
            <input
              type="number"
              min={1}
              max={8}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              required
              className={`w-24 ${fieldBase}`}
            />
          </label>
        )}
      </fieldset>

      {error && (
        <p className="note note-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || seatsInvalid}
        className="btn-glow w-full rounded-2xl py-3 disabled:opacity-50"
      >
        {loading ? 'Sumándote…' : 'Sumarme al grupo'}
      </button>
    </form>
  );
}
