'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn('credentials', {
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
        redirect: false,
      });
      if (result?.error) {
        setError('Email o contraseña incorrectos');
      } else {
        router.push('/');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow"
      >
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Contraseña
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p className="text-center text-sm text-gray-500">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="underline">
            Crear cuenta gratis
          </Link>
        </p>
      </form>
    </main>
  );
}
