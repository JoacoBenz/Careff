import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PlanResultView } from '@/components/plan-result';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { FlagIcon } from '@/components/icons';
import type { CarpoolPlanResult } from '@/lib/carpool';

interface PageProps {
  params: Promise<{ token: string }>;
}

// Share links live or die on WhatsApp: give each plan its own link-preview
// card (title + destination). Secret-token page → never indexable.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const plan = await prisma.carpoolPlan.findUnique({ where: { shareToken: token } });
  if (!plan) return { title: 'Plan no encontrado', robots: { index: false, follow: false } };
  const description = `Mirá quién lleva a quién y la ruta de cada auto · Destino: ${plan.destination}`;
  return {
    title: plan.title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${plan.title} · Careff`,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${plan.title} · Careff`,
      description,
    },
  };
}

// Public read-only view of a saved plan, reachable by share token only.
export default async function SharedPlanPage({ params }: PageProps) {
  const { token } = await params;
  const plan = await prisma.carpoolPlan.findUnique({ where: { shareToken: token } });
  if (!plan) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <PageHeader
          eyebrow="Plan compartido"
          title={plan.title}
          description={
            <span className="inline-flex items-center gap-1.5">
              <FlagIcon className="h-3.5 w-3.5 flex-none" />
              {plan.destination} · {plan.createdAt.toLocaleDateString('es-AR')}
            </span>
          }
        />
        <PlanResultView
          plan={plan.result as unknown as CarpoolPlanResult}
          title={plan.title}
          showExpenses={false}
        />
        <div className="surface mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold text-white">¿Tenés que organizar un viaje así?</p>
            <p className="text-sm text-[var(--ink-dim)]">
              Gratis y sin registrarte: cargás el grupo y sale armado.
            </p>
          </div>
          <Link href="/planner" className="btn-glow rounded-xl px-5 py-2.5 text-sm">
            Armalo con Careff
          </Link>
        </div>
      </main>
    </div>
  );
}
