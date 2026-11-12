'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleButton } from './google-button';
import { inputClass } from './form-styles';

export function LoginForm({
  callbackUrl,
  googleEnabled,
  initialError,
  notice,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
  initialError?: string;
  notice?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

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
        setError(
          result.code === 'rate_limited'
            ? 'Demasiados intentos. Esperá unos minutos o cambiá tu contraseña.'
            : 'Email o contraseña incorrectos',
        );
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
      {notice && !error && (
        <p className="note note-ok mb-4" role="status">
          {notice}
        </p>
      )}
      {googleEnabled && <GoogleButton callbackUrl={callbackUrl} />}
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="note note-error" role="alert">
            {error}
          </p>
        )}
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
            autoComplete="current-password"
            className={inputClass}
          />
          <Link
            href="/forgot-password"
            className="link-sweep link-amber mt-1.5 inline-block text-xs"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn-glow w-full rounded-xl py-2.5 disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </>
  );
}
