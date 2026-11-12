'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { inputClass } from '@/components/form-styles';
import type { ApiErrorBody } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: String(form.get('name') ?? ''), email, password }),
      });
      if (!response.ok) {
        const body = (await response.json()) as ApiErrorBody;
        setError(body.error.message);
        return;
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        router.push('/login');
      } else {
        router.push('/planner');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Creá tu cuenta"
      subtitle="Gratis para siempre. Sin tarjeta de crédito."
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="link-sweep link-amber">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="note note-error" role="alert">
            {error}
          </p>
        )}
        <label className="block">
          <span className="field-label">Nombre</span>
          <input name="name" type="text" required autoComplete="name" className={inputClass} />
        </label>
        <label className="block">
          <span className="field-label">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vos@mail.com"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="field-label">Contraseña</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs text-[var(--ink-faint)]">Mínimo 8 caracteres.</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn-glow w-full rounded-xl py-2.5 disabled:opacity-50"
        >
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
