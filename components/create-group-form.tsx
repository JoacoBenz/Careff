'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorBody } from '@/types';
import { inputClass } from './form-styles';

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setError((body as ApiErrorBody).error.message);
        return;
      }
      router.push(`/groups/${(body as { id: number }).id}`);
      router.refresh();
    } catch {
      setError('No se pudo crear el grupo. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fútbol de los jueves"
          required
          maxLength={80}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-glow shrink-0 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Creando…' : 'Crear grupo'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
