'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { seatBudget } from '@/lib/seat-budget';
import { AddressInput } from './address-input';
import { PlanResultView, CopyLinkButton } from './plan-result';
import { RouteLoading } from './route-loading';
import { RegionSelect, type RegionValue } from './region-select';
import { useRegion } from './use-region';
import { useOrigin } from './use-origin';
import { useCarpoolPlan } from './use-carpool-plan';
import { inputClass } from './form-styles';

export interface GroupMemberView {
  id: number;
  name: string;
  address: string;
  hasCar: boolean;
  seats: number;
  lat?: number | null;
  lon?: number | null;
}

export function InviteBox({ inviteUrl, groupName }: { inviteUrl: string; groupName: string }) {
  const message = `🚗 Sumate al grupo «${groupName}» en Careff para organizar quién lleva a quién. Decí si tenés auto y desde dónde salís acá: ${inviteUrl}`;
  return (
    <div className="rounded-xl border border-dashed border-amber-300/70 bg-white p-4">
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
  const [error, setError] = useState<string | null>(null);

  async function remove(memberId: number) {
    setRemoving(memberId);
    setError(null);
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        setError('No se pudo quitar al integrante. Intentá de nuevo.');
        return;
      }
      router.refresh();
    } catch {
      setError('No se pudo quitar al integrante. Revisá tu conexión.');
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
    <>
      {error && (
        <p className="mb-2 rounded-lg bg-red-50 p-2.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
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
    </>
  );
}

export function GroupPlanner({
  groupName,
  members,
  initialRegion,
}: {
  groupName: string;
  members: GroupMemberView[];
  initialRegion?: RegionValue;
}) {
  const [region, setRegion] = useRegion(initialRegion);
  const origin = useOrigin();
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<
    { lat: number; lon: number } | undefined
  >();
  const { loading, error, result, submit } = useCarpoolPlan();

  const drivers = members.filter((m) => m.hasCar && m.seats > 0);
  const passengers = members.filter((m) => !m.hasCar);
  const { totalSeats, overCapacity } = seatBudget(
    drivers.map((d) => d.seats),
    passengers.length,
  );
  const ready = drivers.length > 0 && passengers.length > 0 && !overCapacity;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Reuse the coordinates captured when each member joined, so the server
    // skips re-geocoding them; add the destination's coords too.
    const coords: Record<string, { lat: number; lon: number }> = {};
    for (const m of members) {
      if (m.lat != null && m.lon != null) coords[m.address] = { lat: m.lat, lon: m.lon };
    }
    if (destinationCoords) coords[destination] = destinationCoords;

    await submit({
      title: `${groupName} — viaje`,
      destination,
      drivers: drivers.map((d) => ({ name: d.name, address: d.address, capacity: d.seats })),
      passengers: passengers.map((p) => ({ name: p.name, address: p.address })),
      coords: Object.keys(coords).length > 0 ? coords : undefined,
      country: region.country,
      provincia: region.provincia,
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {loading && <RouteLoading />}
      <h2 className="font-semibold text-slate-900">Planificar el viaje del grupo</h2>
      <p className="mt-1 text-sm text-slate-500">
        {drivers.length} conductor{drivers.length === 1 ? '' : 'es'} ({totalSeats} asiento
        {totalSeats === 1 ? '' : 's'}) · {passengers.length} pasajero
        {passengers.length === 1 ? '' : 's'}
      </p>
      {!ready && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {overCapacity
            ? `Hay ${passengers.length} pasajeros pero solo ${totalSeats} asiento${totalSeats === 1 ? '' : 's'}. Hace falta otro conductor o más asientos libres para que entren todos.`
            : 'Para armar el viaje hace falta al menos un conductor con asientos y un pasajero.'}
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="text-sm text-slate-600">
          Región (mejora la precisión de las direcciones)
          <div className="mt-1">
            <RegionSelect value={region} onChange={setRegion} />
          </div>
        </div>
        <label className="block text-sm text-slate-600">
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
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !ready}
          className="btn-glow w-full rounded-xl py-2.5 disabled:opacity-50"
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
            regionName={region.provinceName}
            shareUrl={result.shareToken && origin ? `${origin}/p/${result.shareToken}` : undefined}
          />
        </div>
      )}
    </section>
  );
}
