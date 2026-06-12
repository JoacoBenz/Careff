import Link from 'next/link';
import { auth } from '@/lib/auth';
import { LogoutButton } from './logout-button';

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <span aria-hidden>🚗</span> Careff
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/planner" className="text-slate-300 hover:text-white">
            Planificador
          </Link>
          {session?.user ? (
            <>
              <Link href="/groups" className="text-slate-300 hover:text-white">
                Mis grupos
              </Link>
              <Link href="/plans" className="text-slate-300 hover:text-white">
                Mis planes
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-300 hover:text-white">
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn-glow rounded-lg px-3 py-1.5">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
