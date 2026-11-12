'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { NavPill } from './nav-pill';
import { LogoutButton } from './logout-button';
import { CloseIcon, MenuIcon } from './icons';

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
            ? 'block rounded-xl bg-amber-400/15 px-3.5 py-3 text-sm font-medium text-amber-300'
            : 'block rounded-xl px-3.5 py-3 text-sm font-medium text-slate-200 hover:bg-white/10'
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
            <Link href="/register" className="btn-glow ml-1.5 rounded-full px-4 py-1.5 text-sm">
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
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line-strong)] text-slate-200 sm:hidden"
      >
        {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {/* Phone: dropdown panel */}
      {open && (
        <div className="rise absolute inset-x-0 top-16 border-b border-[var(--line)] bg-[#030712]/95 shadow-2xl backdrop-blur-xl sm:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 p-3">
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
                  className="rounded-xl px-3.5 py-3 text-left text-sm font-medium text-slate-400 hover:bg-white/10"
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
                  className="btn-glow mt-1 rounded-xl px-3 py-3 text-center text-sm"
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
