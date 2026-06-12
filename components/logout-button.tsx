'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-sm text-slate-400 underline hover:text-slate-200"
    >
      Cerrar sesión
    </button>
  );
}
