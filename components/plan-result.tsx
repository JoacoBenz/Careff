'use client';

import { useEffect, useState } from 'react';
import type { CarpoolPlanResult, DriverRoute } from '@/lib/carpool';
import { computeExpense, formatMoney } from '@/lib/expenses';

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
): string {
  const lines = [`🚗 *${title}*`, '', `${route.driver}, esta es tu ruta:`];
  route.stops.forEach((stop, i) => lines.push(`${i + 1}. Buscar a ${stop.name} — ${stop.address}`));
  lines.push(
    `🏁 Destino: ${route.addresses[route.addresses.length - 1]}`,
    `📏 ${km(route.distanceMeters)} en total`,
  );
  if (perPassenger > 0) lines.push(`💸 Cada pasajero pone ${formatMoney(perPassenger)}`);
  lines.push(
    '',
    `🗺️ Ruta en el mapa: ${route.mapUrl}`,
    '',
    origin ? `Armado con Careff — ${origin}` : 'Armado con Careff',
  );
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
    >
      {copied ? '✓ Copiado' : '🔗 Copiar link del plan'}
    </button>
  );
}

const accents = [
  'border-l-emerald-500',
  'border-l-sky-500',
  'border-l-amber-500',
  'border-l-rose-500',
];

const numInput =
  'w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

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
  const passengerCount = Object.keys(plan.assignments).length;

  // Trip-wide expense inputs (fuel price + consumption + who pays).
  const [price, setPrice] = useState(DEFAULT_PRICE);
  const [consumo, setConsumo] = useState(DEFAULT_CONSUMO);
  const [driverPays, setDriverPays] = useState(true);
  const [roundTrip, setRoundTrip] = useState(false);
  const [priceNote, setPriceNote] = useState<string | null>(null);
  const [priceTouched, setPriceTouched] = useState(false);
  // Per-car tolls/extras, keyed by route index.
  const [extras, setExtras] = useState<Record<number, string>>({});
  // Resolved after mount so the WhatsApp link matches between SSR and client
  // (reading window.location during render breaks hydration on shared pages).
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Post-mount sync of a browser-only value; safe and intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          [String(plan.routes.length), plan.routes.length === 1 ? 'auto' : 'autos'],
          [
            String(passengerCount),
            passengerCount === 1 ? 'pasajero ubicado' : 'pasajeros ubicados',
          ],
          [km(plan.totalDistanceMeters), 'distancia total'],
        ].map(([big, label]) => (
          <div key={label} className="rounded-xl bg-emerald-50 px-2 py-3">
            <p className="text-xl font-bold text-emerald-700">{big}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {plan.unassigned.length > 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800" role="alert">
          ⚠️ Sin lugar en ningún auto: {plan.unassigned.join(', ')}. Sumá otro conductor o más
          asientos.
        </p>
      )}

      {/* Trip expense controls — organizer only (hidden on the share link) */}
      {showExpenses && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Gastos del viaje (opcional)</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Estimamos la nafta con la distancia de cada auto. Sumá peajes y dividimos entre los que
            viajan.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3">
            <label className="text-xs text-slate-600">
              Precio nafta ($/L)
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setPriceTouched(true);
                  setPriceNote(null);
                }}
                className={`mt-1 block ${numInput}`}
              />
              {priceNote && (
                <span className="mt-0.5 block text-[11px] text-emerald-700">💡 {priceNote}</span>
              )}
            </label>
            <label className="text-xs text-slate-600">
              Consumo (L/100km)
              <input
                type="number"
                min={0}
                value={consumo}
                onChange={(e) => setConsumo(e.target.value)}
                className={`mt-1 block ${numInput}`}
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={roundTrip}
                onChange={(e) => setRoundTrip(e.target.checked)}
                className="accent-emerald-600"
              />
              Ida y vuelta (duplica la nafta)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={driverPays}
                onChange={(e) => setDriverPays(e.target.checked)}
                className="accent-emerald-600"
              />
              El conductor también pone su parte
            </label>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {plan.routes.map((route, i) => {
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
              className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${accents[i % accents.length]}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">🚗 {route.driver}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {km(route.distanceMeters)}
                </span>
              </div>
              <ol className="mt-3 space-y-1.5 text-sm text-slate-700">
                {route.stops.map((stop, n) => (
                  <li key={stop.name} className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      {n + 1}
                    </span>
                    <span>
                      Buscar a <strong>{stop.name}</strong>
                      <span className="text-slate-400"> · {stop.address}</span>
                    </span>
                  </li>
                ))}
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs">
                    🏁
                  </span>
                  <span className="text-slate-500">
                    {route.addresses[route.addresses.length - 1]}
                  </span>
                </li>
              </ol>

              {/* Per-car costs — organizer only */}
              {expense && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-600">
                      Nafta {formatMoney(expense.fuel)}
                      {roundTrip && <span className="text-slate-400"> (ida y vuelta)</span>}
                      <span className="text-slate-400"> + peajes </span>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={extras[i] ?? ''}
                        onChange={(e) => setExtras((prev) => ({ ...prev, [i]: e.target.value }))}
                        className="w-20 rounded border border-slate-300 px-2 py-0.5 text-sm focus:border-emerald-500 focus:outline-none"
                        aria-label={`Peajes y extras de ${route.driver}`}
                      />
                    </span>
                    <span className="font-medium text-slate-700">
                      Total {formatMoney(expense.total)}
                    </span>
                  </div>
                  {route.stops.length > 0 && expense.perPassenger > 0 && (
                    <p className="mt-2 font-medium text-emerald-700">
                      Cada pasajero le pone {formatMoney(expense.perPassenger)} a {route.driver}
                      {driverPays ? '' : ' (el conductor no paga)'}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={whatsappUrl(route, title, expense?.perPassenger ?? 0, origin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Enviar por WhatsApp
                </a>
                <a
                  href={route.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  🗺️ Ver en Google Maps
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      {shareUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-white p-3">
          <CopyLinkButton url={shareUrl} />
          <p className="text-xs text-slate-500">
            Cualquiera con el link puede ver este plan (solo lectura).
          </p>
        </div>
      )}
    </div>
  );
}
