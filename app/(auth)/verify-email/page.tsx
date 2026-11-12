import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { consumeAuthToken } from '@/lib/auth-tokens';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Confirmar email',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

interface PageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

// Landing page for the emailed confirmation link: burns the token and marks
// the address as verified. Works whether or not the visitor is logged in (the
// link is often opened on another device).
export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  let verified = false;
  if (token.length >= 16 && token.length <= 128) {
    const userId = await consumeAuthToken(token, 'EMAIL_VERIFY');
    if (userId) {
      await prisma.user.updateMany({
        where: { id: userId, emailVerified: null },
        data: { emailVerified: new Date() },
      });
      verified = true;
    }
  }

  return (
    <AuthShell
      title={verified ? 'Email confirmado' : 'No pudimos confirmar tu email'}
      subtitle={verified ? 'Listo: tu cuenta quedó protegida.' : 'El link venció o ya fue usado.'}
      footer={
        <Link href="/planner" className="link-sweep link-amber">
          Ir al planificador
        </Link>
      }
    >
      {verified ? (
        <p className="note note-ok" role="status">
          Gracias. Ya podés recuperar tu cuenta por email si alguna vez perdés la contraseña.
        </p>
      ) : (
        <p className="note note-warn" role="alert">
          Si tu email ya estaba confirmado, no tenés que hacer nada. Si no, pedí un link nuevo desde{' '}
          <Link href="/profile" className="link-sweep font-semibold underline">
            tu perfil
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
