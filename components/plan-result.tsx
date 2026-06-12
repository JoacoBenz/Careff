'use client';

import { useState } from 'react';
import type { CarpoolPlanResult, DriverRoute } from '@/lib/carpool';

const km = (meters: number) => `${(meters / 1000).toFixed(1)} km`;

function whatsappUrl(route: DriverRoute, title: string): string {
  const lines = [`🚗 *${title}*`, '', `${route.driver}, esta es tu ruta:`];
  route.stops.forEach((stop, i) => lines.push(`${i + 1}. Buscar a ${stop.name} — ${stop.address}`));
  lines.push(
    `🏁 Destino: ${route.addresses[route.addresses.length - 1]}`,
    `📏 ${km(route.distanceMeters)} en total`,
    '',
    `🗺️ Ruta en el mapa: ${route.mapUrl}`,
    '',
    `Armado con Careff — ${typeof window === 'undefined' ? '' : window.location.origin}`,
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

export function PlanResultView({
  plan,
  title,
  shareUrl,
}: {
  plan: CarpoolPlanResult;
  title: string;
  shareUrl?: string;
}) {
  const passengerCount = Object.keys(plan.assignments).length;

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

      <ul className="space-y-3">
        {plan.routes.map((route, i) => (
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
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={whatsappUrl(route, title)}
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
        ))}
      </ul>

      {shareUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-3">
          <CopyLinkButton url={shareUrl} />
          <p className="text-xs text-slate-500">
            Cualquiera con el link puede ver este plan (solo lectura).
          </p>
        </div>
      )}
    </div>
  );
}
