import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlanResultView } from '@/components/plan-result';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import {
  CarIcon,
  ChevronDownIcon,
  FlagIcon,
  PlusIcon,
  RouteIcon,
  UsersIcon,
} from '@/components/icons';
import type { CarpoolPlanResult } from '@/lib/carpool';

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const requestHeaders = await headers();
  const host = requestHeaders.get('host') ?? 'localhost:3000';
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';

  const plans = await prisma.carpoolPlan.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <PageHeader
          eyebrow="Historial"
          title="Mis planes"
          description={
            plans.length > 0
              ? `${plans.length} plan${plans.length === 1 ? '' : 'es'} guardado${plans.length === 1 ? '' : 's'}. Tocá uno para ver las rutas y compartirlo.`
              : undefined
          }
          action={
            <Link href="/planner" className="btn-glow rounded-xl px-4 py-2.5 text-sm">
              <PlusIcon className="h-4 w-4" />
              Nuevo viaje
            </Link>
          }
        />
        {plans.length === 0 ? (
          <div className="surface-dashed p-12 text-center">
            <RouteIcon className="mx-auto h-10 w-10 text-[var(--ink-faint)]" />
            <p className="mt-3 font-medium text-white">Todavía no guardaste ningún plan</p>
            <p className="mt-1 text-sm text-[var(--ink-dim)]">
              Los planes que calcules con tu cuenta aparecen acá.
            </p>
            <Link
              href="/planner"
              className="btn-glow mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm"
            >
              Armá el primero en un minuto
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {plans.map((plan, i) => {
              const result = plan.result as unknown as CarpoolPlanResult;
              const riders = result.routes.reduce((sum, r) => sum + r.stops.length, 0);
              return (
                <li key={plan.id} className="rise" style={{ ['--d' as string]: `${i * 40}ms` }}>
                  {/* Collapsed by default (newest open): 50 full plans is a wall. */}
                  <details className="surface group" open={i === 0}>
                    <summary className="flex items-center justify-between gap-4 p-4 sm:p-5">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-white">{plan.title}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ink-dim)]">
                          <FlagIcon className="h-3.5 w-3.5 flex-none" />
                          <span className="truncate">{plan.destination}</span>
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <span className="chip">
                            {plan.createdAt.toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="chip">
                            <CarIcon className="h-3.5 w-3.5" />
                            {result.routes.length}
                          </span>
                          <span className="chip">
                            <UsersIcon className="h-3.5 w-3.5" />
                            {riders}
                          </span>
                          <span className="chip tabular-nums">
                            {(result.totalDistanceMeters / 1000).toFixed(1)} km
                          </span>
                        </div>
                      </div>
                      <ChevronDownIcon className="caret h-5 w-5 flex-none text-[var(--ink-faint)]" />
                    </summary>
                    <div className="border-t border-[var(--line)] p-4 sm:p-5">
                      <PlanResultView
                        plan={result}
                        title={plan.title}
                        shareUrl={
                          plan.shareToken ? `${protocol}://${host}/p/${plan.shareToken}` : undefined
                        }
                      />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
