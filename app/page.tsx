import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Careff</h1>
        <p className="mt-3 text-lg text-gray-600">
          Organizá viajes compartidos sin esfuerzo: cargá quiénes tienen auto, quiénes necesitan que
          los lleven y el destino final. Careff asigna cada pasajero al conductor más cercano y arma
          la ruta de cada auto.
        </p>
        <p className="mt-2 text-sm text-gray-500">Gratis, sin límites y sin tarjeta de crédito.</p>
      </div>
      <div className="flex gap-3">
        {session?.user ? (
          <>
            <Link
              href="/planner"
              className="rounded-lg bg-black px-5 py-2.5 text-white hover:bg-gray-800"
            >
              Planificar un viaje
            </Link>
            <Link
              href="/plans"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 hover:bg-gray-100"
            >
              Mis planes
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/register"
              className="rounded-lg bg-black px-5 py-2.5 text-white hover:bg-gray-800"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 hover:bg-gray-100"
            >
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
