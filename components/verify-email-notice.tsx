'use client';

import { useState } from 'react';
import type { ApiErrorBody } from '@/types';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** Soft reminder shown while the account's email is still unconfirmed. */
export function VerifyEmailNotice({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    setStatus('sending');
    setMessage(null);
    try {
      const response = await fetch('/api/auth/verify-email', { method: 'POST' });
      if (response.ok) {
        setStatus('sent');
        return;
      }
      const body = (await response.json()) as ApiErrorBody;
      setMessage(body.error.message);
      setStatus('error');
    } catch (error) {
      console.error(error);
      setMessage('No pudimos mandar el email. Probá de nuevo.');
      setStatus('error');
    }
  }

  return (
    <div className="note note-warn rise mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="min-w-0">
        {status === 'sent' ? (
          <>
            Te mandamos un link a <strong className="font-semibold">{email}</strong>. Revisá también
            el spam.
          </>
        ) : (
          <>
            Confirmá tu email (<strong className="font-semibold">{email}</strong>) para proteger tu
            cuenta y poder recuperarla.
          </>
        )}
        {message && <span className="mt-1 block">{message}</span>}
      </p>
      {status !== 'sent' && (
        <button
          type="button"
          onClick={resend}
          disabled={status === 'sending'}
          className="btn-glass flex-none rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          {status === 'sending' ? 'Enviando…' : 'Reenviar email'}
        </button>
      )}
    </div>
  );
}
