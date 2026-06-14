import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlannerForm } from '@/components/planner-form';
import { SiteHeader } from '@/components/site-header';
import type { RegionValue } from '@/components/region-select';

// Public on purpose (guest mode): anyone can compute a plan; saving requires
// an account and happens automatically when logged in.
export default async function PlannerPage() {
  const session = await auth();

  // Logged-in users start with the region saved in their profile; guests get
  // their device default (localStorage / geolocation) on the client.
  let initialRegion: RegionValue | undefined;
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { defaultCountry: true, defaultProvinceId: true, defaultProvinceName: true },
    });
    if (user?.defaultCountry || user?.defaultProvinceId) {
      initialRegion = {
        country: user.defaultCountry ?? 'ar',
        provincia: user.defaultProvinceId ?? undefined,
        provinceName: user.defaultProvinceName ?? undefined,
      };
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Planificar un viaje</h1>
          <p className="text-sm text-slate-400">
            Cargá conductores, pasajeros y destino. Careff combina todos los autos y arma el
            conjunto de rutas más eficiente para el grupo.
          </p>
        </header>
        <PlannerForm loggedIn={Boolean(session?.user)} initialRegion={initialRegion} />
      </main>
    </div>
  );
}
