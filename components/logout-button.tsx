'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium text-slate-400 transition hover:border-slate-700 hover:bg-white/10 hover:text-slate-200"
    >
      Cerrar sesión
    </button>
  );
}
