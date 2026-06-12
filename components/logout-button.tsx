'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-sm text-gray-500 underline hover:text-gray-700"
    >
      Cerrar sesión
    </button>
  );
}
