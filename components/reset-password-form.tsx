'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { inputClass } from './form-styles';
import type { ApiErrorBody } from '@/types';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password !== String(form.get('confirm') ?? '')) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        const body = (await response.json()) as ApiErrorBody;
        if (body.error.code === 'INVALID_TOKEN') setExpired(true);
        setError(
          body.error.code === 'VALIDATION'
            ? 'La contraseña debe tener entre 8 y 128 caracteres.'
            : body.error.message,
        );
        return;
      }
      router.push('/login?reset=1');
    } catch (caught) {
      console.error(caught);
      setError('No pudimos guardar la contraseña. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="note note-error" role="alert">
          {error}{' '}
          {expired && (
            <Link href="/forgot-password" className="link-sweep font-semibold underline">
              Pedir otro link
            </Link>
          )}
        </p>
      )}
      <label className="block">
        <span className="field-label">Nueva contraseña</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={inputClass}
        />
        <span className="mt-1.5 block text-xs text-[var(--ink-faint)]">Mínimo 8 caracteres.</span>
      </label>
      <label className="block">
        <span className="field-label">Repetila</span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={loading || expired}
        className="btn-glow w-full rounded-xl py-2.5 disabled:opacity-50"
      >
        {loading ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  );
}
