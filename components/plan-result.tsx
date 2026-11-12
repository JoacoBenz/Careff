'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { CarpoolPlanResult, DriverRoute } from '@/lib/carpool';
import { computeExpense, formatMoney } from '@/lib/expenses';
import { useOrigin } from './use-origin';
import { RouteMap } from './route-map';
import { routeColor } from './route-colors';
import { fieldBase } from './form-styles';
import {
  AlertIcon,
  CarIcon,
  CheckIcon,
  FlagIcon,
  LinkIcon,
  MapIcon,
  RouteIcon,
  UsersIcon,
  WalletIcon,
  WhatsAppIcon,
} from './icons';

const km = (meters: number) => `${(meters / 1000).toFixed(1)} km`;

// Editable fallback when the Energía price feed is unavailable. Prices move
// with inflation, so this is just a starting point the user adjusts.
const DEFAULT_PRICE = '1200';
const DEFAULT_CONSUMO = '10';

function whatsappUrl(
  route: DriverRoute,
  title: string,
  perPassenger: number,
  origin: string,
  roundTrip: boolean,
): string {
  const lines = [`🚗 *${title}*`, '', `${route.driver}, esta es tu ruta:`];
  route.stops.forEach((stop, i) => lines.push(`${i + 1}. Buscar a ${stop.name} — ${stop.address}`));
  lines.push(
    `🏁 Destino: ${route.addresses[route.addresses.length - 1]}`,
    `📏 ${km(route.distanceMeters)} en total`,
  );
  if (perPassenger > 0) {
    lines.push(
      `💸 Cada pasajero pone ${formatMoney(perPassenger)}${roundTrip ? ' (ida y vuelta)' : ''}`,
    );
  }
  lines.push(
    '',
    `🗺️ Ruta en el mapa: ${route.mapUrl}`,
    '',
    origin ? `Armado con Careff — ${origin}` : 'Armado con Careff',
  );
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function CopyLinkButton({ url, label = 'Copiar link' }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="btn-glass rounded-xl px-3.5 py-2 text-sm font-medium"
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4 text-emerald-300" /> Copiado
        </>
      ) : (
        <>
          <LinkIcon className="h-4 w-4" /> {label}
        </>
      )}
    </button>
  );
}

export function PlanResultView({
  plan,
  title,
  shareUrl,
  regionName,
  showExpenses = true,
}: {
  plan: CarpoolPlanResult;
  title: string;
  shareUrl?: string;
  regionName?: string;
  /** Hidden on the public share link (read-only) — only the organizer sees it. */
  showExpenses?: boolean;
}) {
  // Count placed passengers from the routes (robust to two passengers sharing
  // a name, which would collide in the name-keyed assignments map).
  const passengerCount = plan.routes.reduce((sum, r) => sum + r.stops.length, 0);

  // Trip-wide expense inputs (fuel price + consumption + who pays).
  const [price, setPrice] = useState(DEFAULT_PRICE);
  const [consumo, setConsumo] = useState(DEFAULT_CONSUMO);
  const [driverPays, setDriverPays] = useState(true);
  const [roundTrip, setRoundTrip] = useState(false);
  const [priceNote, setPriceNote] = useState<string | null>(null);
  const [priceTouched, setPriceTouched] = useState(false);
  // Per-car tolls/extras, keyed by route index.
  const [extras, setExtras] = useState<Record<number, string>>({});
  // Resolved after mount so the WhatsApp link matches between SSR and client.
  const origin = useOrigin();

  // Pre-fill the fuel price from the Energía open dataset (best-effort).
  useEffect(() => {
    if (!showExpenses) return;
    const params = regionName ? `?prov=${encodeURIComponent(regionName)}` : '';
    fetch(`/api/fuel-price${params}`)
      .then((r) => r.json())
      .then((d: { price: number | null; asOf?: string }) => {
        if (priceTouched || typeof d.price !== 'number') return;
        setPrice(String(d.price));
        setPriceNote(
          d.asOf ? `precio sugerido (Energía, ${d.asOf.slice(0, 10)})` : 'precio sugerido',
        );
      })
      .catch(() => {});
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = [
    {
      icon: <CarIcon className="h-4 w-4" />,
      big: String(plan.routes.length),
      label: plan.routes.length === 1 ? 'auto' : 'autos',
    },
    {
      icon: <UsersIcon className="h-4 w-4" />,
      big: String(passengerCount),
      label: passengerCount === 1 ? 'pasajero ubicado' : 'pasajeros ubicados',
    },
    {
      icon: <RouteIcon className="h-4 w-4" />,
      big: km(plan.totalDistanceMeters),
      label: 'distancia total',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="surface px-3 py-3.5 sm:px-4">
            <p className="flex items-center gap-1.5 text-[var(--ink-faint)]">{stat.icon}</p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-white sm:text-2xl">
              {stat.big}
            </p>
            <p className="text-xs text-[var(--ink-dim)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {plan.unassigned.length > 0 && (
        <p className="note note-warn flex gap-2" role="alert">
          <AlertIcon className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            Sin lugar en ningún auto: {plan.unassigned.join(', ')}. Sumá otro conductor o más
            asientos.
          </span>
        </p>
      )}

      <RouteMap routes={plan.routes} />

      {/* Trip expense controls — organizer only (hidden on the share link) */}
      {showExpenses && (
        <div className="surface p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <WalletIcon className="h-4 w-4 text-amber-300" />
            Gastos del viaje <span className="font-normal text-[var(--ink-faint)]">· opcional</span>
          </h3>
          <p className="mt-1 text-xs text-[var(--ink-dim)]">
            Estimamos la nafta con la distancia de cada auto. Sumá peajes y dividimos entre los que
            viajan.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-3">
            <label>
              <span className="field-label">Precio nafta ($/L)</span>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setPriceTouched(true);
                  setPriceNote(null);
                }}
                className={`${fieldBase} w-32`}
              />
            </label>
            <label>
              <span className="field-label">Consumo (L/100km)</span>
              <input
                type="number"
                min={0}
                value={consumo}
                onChange={(e) => setConsumo(e.target.value)}
                className={`${fieldBase} w-32`}
              />
            </label>
            <div className="space-y-2 pb-1 text-sm text-[var(--ink-dim)]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roundTrip}
                  onChange={(e) => setRoundTrip(e.target.checked)}
                />
                Ida y vuelta (duplica la nafta)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={driverPays}
                  onChange={(e) => setDriverPays(e.target.checked)}
                />
                El conductor también pone su parte
              </label>
            </div>
          </div>
          {priceNote && <p className="mt-2 text-xs text-amber-300/90">{priceNote}</p>}
        </div>
      )}

      <ul className="space-y-3">
        {plan.routes.map((route, i) => {
          const color = routeColor(i);
          const expense = showExpenses
            ? computeExpense({
                distanceMeters: route.distanceMeters,
                litersPer100km: Number(consumo) || 0,
                pricePerLiter: Number(price) || 0,
                extras: Number(extras[i]) || 0,
                passengers: route.stops.length,
                driverPays,
                roundTrip,
              })
            : null;
          return (
            <li
              key={route.driver}
              className="surface overflow-hidden"
              style={{ '--car': color } as CSSProperties}
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-[var(--car)]" aria-hidden />
              <div className="p-4 pl-5 sm:p-5 sm:pl-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex min-w-0 items-center gap-2.5 font-semibold text-white">
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-[var(--car)]"
                      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
                    >
                      <CarIcon className="h-5 w-5" />
                    </span>
                    <span className="truncate">{route.driver}</span>
                  </h3>
                  <span className="chip flex-none tabular-nums">{km(route.distanceMeters)}</span>
                </div>

                {/* Stops as a timeline along the car's color */}
                <ol className="relative mt-4 space-y-3 text-sm">
                  <span
                    className="absolute bottom-3 left-[11px] top-3 w-px bg-[var(--car)] opacity-30"
                    aria-hidden
                  />
                  {route.stops.map((stop, n) => (
                    <li key={stop.name} className="relative flex gap-3">
                      <span className="z-[1] flex h-6 w-6 flex-none items-center justify-center rounded-full border border-[var(--car)] bg-[#0b1220] text-xs font-bold text-[var(--car)]">
                        {n + 1}
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="text-[var(--ink-dim)]">Buscar a </span>
                        <strong className="font-semibold text-white">{stop.name}</strong>
                        <span className="block truncate text-xs text-[var(--ink-faint)]">
                          {stop.address}
                        </span>
                      </span>
                    </li>
                  ))}
                  <li className="relative flex gap-3">
                    <span className="z-[1] flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-[#0b1220]">
                      <FlagIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </span>
                    <span className="min-w-0 truncate pt-0.5 text-[var(--ink-dim)]">
                      {route.addresses[route.addresses.length - 1]}
                    </span>
                  </li>
                </ol>

                {/* Per-car costs — organizer only */}
                {expense && (
                  <div className="surface-inset mt-4 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[var(--ink-dim)]">
                        Nafta{' '}
                        <span className="tabular-nums text-white">{formatMoney(expense.fuel)}</span>
                        {roundTrip && (
                          <span className="text-[var(--ink-faint)]">(ida y vuelta)</span>
                        )}
                        <span className="text-[var(--ink-faint)]">+ peajes</span>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={extras[i] ?? ''}
                          onChange={(e) => setExtras((prev) => ({ ...prev, [i]: e.target.value }))}
                          className={`${fieldBase} w-24 !py-1`}
                          aria-label={`Peajes y extras de ${route.driver}`}
                        />
                      </span>
                      <span className="font-semibold tabular-nums text-white">
                        Total {formatMoney(expense.total)}
                      </span>
                    </div>
                    {route.stops.length > 0 && expense.perPassenger > 0 && (
                      <p className="mt-2 font-medium text-amber-300">
                        Cada pasajero le pone {formatMoney(expense.perPassenger)} a {route.driver}
                        <span className="font-normal text-[var(--ink-dim)]">
                          {driverPays
                            ? `; ${route.driver} también pone ${formatMoney(expense.perDriver)}`
                            : ' (el conductor no paga)'}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={whatsappUrl(route, title, expense?.perPassenger ?? 0, origin, roundTrip)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-wa rounded-xl px-3.5 py-2 text-sm"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Enviar por WhatsApp
                  </a>
                  <a
                    href={route.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-glass rounded-xl px-3.5 py-2 text-sm font-medium"
                  >
                    <MapIcon className="h-4 w-4" />
                    Abrir en Google Maps
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {shareUrl && (
        <div className="surface-dashed flex flex-wrap items-center gap-3 p-3.5">
          <CopyLinkButton url={shareUrl} label="Copiar link del plan" />
          <p className="text-xs text-[var(--ink-dim)]">
            Cualquiera con el link puede ver este plan (solo lectura).
          </p>
        </div>
      )}
    </div>
  );
}
