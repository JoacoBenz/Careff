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
import { CarIcon, CloseIcon, SparkIcon, UserIcon, UsersIcon, WhatsAppIcon } from './icons';

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
    <div className="surface overflow-hidden p-5">
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/15 blur-3xl"
        aria-hidden
      />
      <p className="eyebrow">Invitación</p>
      <p className="mt-1.5 font-semibold text-white">Cada persona se suma sola con este link</p>
      <p className="surface-inset mt-3 break-all px-3 py-2 font-mono text-xs text-amber-200/90">
        {inviteUrl}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-wa rounded-xl px-3.5 py-2 text-sm"
        >
          <WhatsAppIcon className="h-4 w-4" />
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
      <div className="surface-dashed p-8 text-center">
        <UsersIcon className="mx-auto h-8 w-8 text-[var(--ink-faint)]" />
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          Todavía no se sumó nadie. Mandá el link de invitación al grupo.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="note note-error mb-2" role="alert">
          {error}
        </p>
      )}
      <ul className="surface divide-y divide-[var(--line)] overflow-hidden">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${
                  member.hasCar
                    ? 'bg-amber-400/15 text-amber-300'
                    : 'bg-white/5 text-[var(--ink-dim)]'
                }`}
              >
                {member.hasCar ? <CarIcon className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{member.name}</p>
                <p className="truncate text-xs text-[var(--ink-faint)]">{member.address}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {member.hasCar ? (
                <span className="chip chip-amber">
                  {member.seats} asiento{member.seats === 1 ? '' : 's'}
                </span>
              ) : (
                <span className="chip">pasajero</span>
              )}
              <button
                type="button"
                onClick={() => remove(member.id)}
                disabled={removing === member.id}
                className="btn-icon h-8 w-8"
                aria-label={`Quitar a ${member.name}`}
              >
                <CloseIcon className="h-3.5 w-3.5" />
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
    <section className="surface p-5 sm:p-6">
      {loading && <RouteLoading />}
      <p className="eyebrow">Planificar</p>
      <h2 className="mt-1 text-lg font-semibold text-white">El viaje del grupo</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="chip chip-amber">
          <CarIcon className="h-3.5 w-3.5" />
          {drivers.length} conductor{drivers.length === 1 ? '' : 'es'} · {totalSeats} asiento
          {totalSeats === 1 ? '' : 's'}
        </span>
        <span className="chip">
          <UsersIcon className="h-3.5 w-3.5" />
          {passengers.length} pasajero{passengers.length === 1 ? '' : 's'}
        </span>
      </div>
      {!ready && (
        <p className="note note-warn mt-4">
          {overCapacity
            ? `Hay ${passengers.length} pasajeros pero solo ${totalSeats} asiento${totalSeats === 1 ? '' : 's'}. Hace falta otro conductor o más asientos libres para que entren todos.`
            : 'Para armar el viaje hace falta al menos un conductor con asientos y un pasajero.'}
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <span className="field-label">Región (mejora la precisión de las direcciones)</span>
          <RegionSelect value={region} onChange={setRegion} />
        </div>
        <label className="block">
          <span className="field-label">Destino final</span>
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
        </label>
        {error && (
          <p className="note note-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !ready}
          className="btn-glow w-full rounded-2xl py-3 disabled:opacity-50"
        >
          <SparkIcon className="h-5 w-5" />
          {loading ? 'Calculando rutas…' : 'Calcular quién lleva a quién'}
        </button>
      </form>

      {result && (
        <div className="rise mt-6 space-y-3 border-t border-[var(--line)] pt-6">
          <p className="eyebrow">Resultado</p>
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
