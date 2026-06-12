import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Logo } from './logo';
import { NavPill } from './nav-pill';
import { LogoutButton } from './logout-button';

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="Inicio">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1.5">
          <NavPill href="/planner">Planificador</NavPill>
          {session?.user ? (
            <>
              <NavPill href="/groups">Mis grupos</NavPill>
              <NavPill href="/plans">Mis planes</NavPill>
              <LogoutButton />
            </>
          ) : (
            <>
              <NavPill href="/login">Iniciar sesión</NavPill>
              <Link href="/register" className="btn-glow ml-1 rounded-full px-3.5 py-1.5 text-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
