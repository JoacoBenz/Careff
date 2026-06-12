import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PlanResultView } from '@/components/plan-result';
import { SiteHeader } from '@/components/site-header';
import type { CarpoolPlanResult } from '@/lib/carpool';

// Public read-only view of a saved plan, reachable by share token only.
export default async function SharedPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const plan = await prisma.carpoolPlan.findUnique({ where: { shareToken: token } });
  if (!plan) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{plan.title}</h1>
          <p className="text-sm text-slate-500">
            🏁 {plan.destination} · {plan.createdAt.toLocaleDateString('es-AR')}
          </p>
        </header>
        <PlanResultView plan={plan.result as unknown as CarpoolPlanResult} title={plan.title} />
        <p className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-600">
          ¿Tenés que organizar un viaje así?{' '}
          <Link href="/planner" className="font-medium text-emerald-700 underline">
            Armalo gratis con Careff
          </Link>
        </p>
      </main>
    </div>
  );
}
