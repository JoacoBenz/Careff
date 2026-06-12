import Link from 'next/link';
import { auth } from '@/lib/auth';
import { LogoutButton } from './logout-button';

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span aria-hidden>🚗</span> Careff
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/planner" className="text-slate-600 hover:text-slate-900">
            Planificador
          </Link>
          {session?.user ? (
            <>
              <Link href="/groups" className="text-slate-600 hover:text-slate-900">
                Mis grupos
              </Link>
              <Link href="/plans" className="text-slate-600 hover:text-slate-900">
                Mis planes
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
