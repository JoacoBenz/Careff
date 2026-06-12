import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlanResultView } from '@/components/plan-result';
import { SiteHeader } from '@/components/site-header';
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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Mis planes</h1>
          <Link href="/planner" className="btn-glow rounded-lg px-4 py-2 text-sm">
            + Nuevo viaje
          </Link>
        </header>
        {plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-3xl">🚗</p>
            <p className="mt-2 text-slate-600">Todavía no guardaste ningún plan.</p>
            <Link href="/planner" className="link-sweep font-medium text-emerald-700">
              Armá el primero en un minuto
            </Link>
          </div>
        ) : (
          <ul className="space-y-10">
            {plans.map((plan) => (
              <li key={plan.id}>
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-white">{plan.title}</h2>
                  <p className="text-sm text-slate-400">
                    🏁 {plan.destination} · {plan.createdAt.toLocaleDateString('es-AR')}
                  </p>
                </div>
                <PlanResultView
                  plan={plan.result as unknown as CarpoolPlanResult}
                  title={plan.title}
                  shareUrl={
                    plan.shareToken ? `${protocol}://${host}/p/${plan.shareToken}` : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
