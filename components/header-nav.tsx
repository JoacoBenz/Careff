'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { NavPill } from './nav-pill';
import { LogoutButton } from './logout-button';

/**
 * Header navigation. Inline pills on >= sm; on phones it collapses into a
 * hamburger that opens a full-width dropdown panel (the inline pills would
 * otherwise overflow the viewport once logged in).
 */
export function HeaderNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  function mobileLink(href: string, label: string) {
    return (
      <Link
        href={href}
        onClick={close}
        className={
          active(href)
            ? 'block rounded-lg bg-amber-400/15 px-3 py-2.5 text-sm font-medium text-amber-300'
            : 'block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10'
        }
      >
        {label}
      </Link>
    );
  }

  return (
    <>
      {/* Desktop / tablet: inline pills */}
      <nav className="hidden items-center gap-1.5 sm:flex">
        <NavPill href="/planner">Planificador</NavPill>
        {loggedIn ? (
          <>
            <NavPill href="/groups">Mis grupos</NavPill>
            <NavPill href="/plans">Mis planes</NavPill>
            <NavPill href="/profile">Mi perfil</NavPill>
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

      {/* Phone: hamburger toggle */}
      <button
        type="button"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-lg text-slate-200 sm:hidden"
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Phone: dropdown panel */}
      {open && (
        <div className="absolute inset-x-0 top-14 border-b border-slate-800 bg-slate-950/95 shadow-xl backdrop-blur sm:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col gap-1 p-3">
            {mobileLink('/planner', 'Planificador')}
            {loggedIn ? (
              <>
                {mobileLink('/groups', 'Mis grupos')}
                {mobileLink('/plans', 'Mis planes')}
                {mobileLink('/profile', 'Mi perfil')}
                <button
                  type="button"
                  onClick={() => {
                    close();
                    void signOut({ callbackUrl: '/' });
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-400 hover:bg-white/10"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                {mobileLink('/login', 'Iniciar sesión')}
                <Link
                  href="/register"
                  onClick={close}
                  className="btn-glow mt-1 rounded-lg px-3 py-2.5 text-center text-sm"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
