'use client';

import { useState, type FormEvent } from 'react';
import { inputClass } from './form-styles';
import type { ApiErrorBody } from '@/types';

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const email = String(new FormData(event.currentTarget).get('email') ?? '');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = (await response.json()) as ApiErrorBody;
        setError(
          body.error.code === 'VALIDATION' ? 'Revisá el email ingresado.' : body.error.message,
        );
        return;
      }
      setSentTo(email);
    } catch (caught) {
      console.error(caught);
      setError('No pudimos enviar el pedido. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <p className="note note-ok" role="status">
        Si hay una cuenta con <strong className="font-semibold">{sentTo}</strong>, te mandamos un
        link para elegir una nueva contraseña. Vence en 1 hora; revisá también el spam.
      </p>
    );
  }

  return (
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
      <button
        type="submit"
        disabled={loading}
        className="btn-glow w-full rounded-xl py-2.5 disabled:opacity-50"
      >
        {loading ? 'Enviando…' : 'Mandarme el link'}
      </button>
    </form>
  );
}
