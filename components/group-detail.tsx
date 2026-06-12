'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { CarpoolPlanResult } from '@/lib/carpool';
import type { ApiErrorBody } from '@/types';
import { AddressInput } from './address-input';
import { PlanResultView, CopyLinkButton } from './plan-result';

export interface GroupMemberView {
  id: number;
  name: string;
  address: string;
  hasCar: boolean;
  seats: number;
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export function InviteBox({ inviteUrl, groupName }: { inviteUrl: string; groupName: string }) {
  const message = `🚗 Sumate al grupo «${groupName}» en Careff para organizar quién lleva a quién. Decí si tenés auto y desde dónde salís acá: ${inviteUrl}`;
  return (
    <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-4">
      <p className="text-sm font-medium text-slate-700">
        Invitá al grupo: cada persona se suma sola con este link
      </p>
      <p className="mt-1 break-all rounded bg-white px-2 py-1 font-mono text-xs text-slate-500">
        {inviteUrl}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Invitar por WhatsApp
        </a>
        <CopyLinkButton url={inviteUrl} />
      </div>
    </div>
  );
}

export function MemberList({ groupId, members }: { groupId: number; members: GroupMemberView[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<number | null>(null);

  async function remove(memberId: number) {
    setRemoving(memberId);
    try {
      await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setRemoving(null);
    }
  }

  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        Todavía no se sumó nadie. Mandá el link de invitación al grupo 👆
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {members.map((member) => (
        <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{member.name}</p>
            <p className="truncate text-xs text-slate-500">{member.address}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {member.hasCar ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                🚗 {member.seats} asiento{member.seats === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                🙋 pasajero
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(member.id)}
              disabled={removing === member.id}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-40"
              aria-label={`Quitar a ${member.name}`}
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface PlanResponse {
  plan: CarpoolPlanResult;
  saved: boolean;
  shareToken?: string;
}

export function GroupPlanner({
  groupName,
  members,
}: {
  groupName: string;
  members: GroupMemberView[];
}) {
  const [destination, setDestination] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);

  const drivers = members.filter((m) => m.hasCar && m.seats > 0);
  const passengers = members.filter((m) => !m.hasCar);
  const totalSeats = drivers.reduce((sum, d) => sum + d.seats, 0);
  const ready = drivers.length > 0 && passengers.length > 0;

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
          title: `${groupName} — viaje`,
          city: city || undefined,
          destination,
          drivers: drivers.map((d) => ({ name: d.name, address: d.address, capacity: d.seats })),
          passengers: passengers.map((p) => ({ name: p.name, address: p.address })),
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Planificar el viaje del grupo</h2>
      <p className="mt-1 text-sm text-slate-500">
        {drivers.length} conductor{drivers.length === 1 ? '' : 'es'} ({totalSeats} asiento
        {totalSeats === 1 ? '' : 's'}) · {passengers.length} pasajero
        {passengers.length === 1 ? '' : 's'}
      </p>
      {!ready && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Para armar el viaje hace falta al menos un conductor con asientos y un pasajero.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-slate-600">
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
          <label className="block text-sm text-slate-600">
            Ciudad (opcional, se agrega a todas las direcciones)
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Buenos Aires, Argentina"
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !ready}
          className="w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Calculando rutas…' : '✨ Calcular quién lleva a quién'}
        </button>
      </form>

      {result && (
        <div className="mt-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Resultado</h3>
          <PlanResultView
            plan={result.plan}
            title={`${groupName} — viaje`}
            shareUrl={
              result.shareToken && typeof window !== 'undefined'
                ? `${window.location.origin}/p/${result.shareToken}`
                : undefined
            }
          />
        </div>
      )}
    </section>
  );
}
