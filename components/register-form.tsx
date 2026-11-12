'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleButton } from './google-button';
import { inputClass } from './form-styles';
import type { ApiErrorBody } from '@/types';

export function RegisterForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
}) {
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
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {googleEnabled && <GoogleButton callbackUrl={callbackUrl} />}
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
        <p className="text-center text-xs leading-relaxed text-[var(--ink-faint)]">
          Al crear tu cuenta aceptás los{' '}
          <Link href="/terms" className="link-sweep link-amber">
            términos
          </Link>{' '}
          y la{' '}
          <Link href="/privacy" className="link-sweep link-amber">
            política de privacidad
          </Link>
          .
        </p>
      </form>
    </>
  );
}
