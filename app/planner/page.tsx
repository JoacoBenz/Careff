import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PlannerForm } from '@/components/planner-form';

export default async function PlannerPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planificar un viaje</h1>
          <p className="text-sm text-gray-500">
            Cargá conductores, pasajeros y destino. Careff arma la distribución más eficiente.
          </p>
        </div>
        <Link href="/plans" className="text-sm underline">
          Mis planes
        </Link>
      </header>
      <PlannerForm />
    </main>
  );
}
