'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { ApiErrorBody } from '@/types';
import { AddressInput } from './address-input';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export function JoinGroupForm({ token, groupName }: { token: string; groupName: string }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [hasCar, setHasCar] = useState(false);
  const [seats, setSeats] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-3xl">🎉</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">
          ¡Listo, {name}! Ya estás en «{groupName}»
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {hasCar
            ? `Quedaste como conductor con ${seats} asiento${Number(seats) === 1 ? '' : 's'} libre${Number(seats) === 1 ? '' : 's'}.`
            : 'Cuando se arme el viaje, un auto te pasa a buscar.'}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          ¿Organizás salidas vos también?{' '}
          <Link href="/register" className="font-medium text-emerald-700 underline">
            Creá tu grupo gratis
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <label className="block text-sm text-slate-600">
        Tu nombre
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          required
          maxLength={80}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="block text-sm text-slate-600">
        Tu dirección (desde dónde salís)
        <div className="mt-1">
          <AddressInput
            value={address}
            onChange={setAddress}
            placeholder="Av. Rivadavia 5000, Buenos Aires"
            required
            className={inputClass}
          />
        </div>
      </label>

      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-sm font-medium text-slate-700">¿Tenés auto?</legend>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="hasCar"
              checked={hasCar}
              onChange={() => setHasCar(true)}
              className="accent-emerald-600"
            />
            🚗 Sí, llevo gente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="hasCar"
              checked={!hasCar}
              onChange={() => setHasCar(false)}
              className="accent-emerald-600"
            />
            🙋 No, necesito que me lleven
          </label>
        </div>
        {hasCar && (
          <label className="mt-3 block text-sm text-slate-600">
            Asientos libres (sin contarte a vos)
            <input
              type="number"
              min={1}
              max={8}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              required
              className={`mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm`}
            />
          </label>
        )}
      </fieldset>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? 'Sumándote…' : 'Sumarme al grupo'}
      </button>
    </form>
  );
}
