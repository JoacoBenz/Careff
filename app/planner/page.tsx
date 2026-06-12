import { auth } from '@/lib/auth';
import { PlannerForm } from '@/components/planner-form';
import { SiteHeader } from '@/components/site-header';

// Public on purpose (guest mode): anyone can compute a plan; saving requires
// an account and happens automatically when logged in.
export default async function PlannerPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Planificar un viaje</h1>
          <p className="text-sm text-slate-500">
            Cargá conductores, pasajeros y destino. Careff combina todos los autos y arma el
            conjunto de rutas más eficiente para el grupo.
          </p>
        </header>
        <PlannerForm loggedIn={Boolean(session?.user)} />
      </main>
    </div>
  );
}
