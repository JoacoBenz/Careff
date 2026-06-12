import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlanResultView } from '@/components/planner-form';
import { LogoutButton } from '@/components/logout-button';
import type { CarpoolPlanResult } from '@/lib/carpool';

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const plans = await prisma.carpoolPlan.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis planes</h1>
        <div className="flex items-center gap-4">
          <Link href="/planner" className="text-sm underline">
            Planificar otro viaje
          </Link>
          <LogoutButton />
        </div>
      </header>
      {plans.length === 0 ? (
        <p className="text-gray-500">
          Todavía no guardaste ningún plan.{' '}
          <Link href="/planner" className="underline">
            Creá el primero
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-8">
          {plans.map((plan) => (
            <li key={plan.id}>
              <div className="mb-2">
                <h2 className="text-lg font-semibold">{plan.title}</h2>
                <p className="text-sm text-gray-500">
                  {plan.destination} · {plan.createdAt.toLocaleDateString('es-AR')}
                </p>
              </div>
              <PlanResultView plan={plan.result as unknown as CarpoolPlanResult} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
