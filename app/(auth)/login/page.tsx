'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { inputClass } from '@/components/form-styles';

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
    <AuthShell
      title="Hola de nuevo"
      subtitle="Entrá para ver tus grupos y planes guardados."
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="link-sweep link-amber">
            Crear cuenta gratis
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
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn-glow w-full rounded-xl py-2.5 disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </AuthShell>
  );
}
