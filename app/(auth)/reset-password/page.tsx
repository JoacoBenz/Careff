import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { ResetPasswordForm } from '@/components/reset-password-form';

export const metadata: Metadata = {
  title: 'Nueva contraseña',
  robots: { index: false, follow: false },
  // Don't leak the token to other sites through the Referer header.
  referrer: 'no-referrer',
};

interface PageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  return (
    <AuthShell
      title="Elegí una nueva contraseña"
      subtitle="El link sirve una sola vez. Después entrás con la contraseña nueva."
      footer={
        <Link href="/login" className="link-sweep link-amber">
          Volver a iniciar sesión
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="note note-error" role="alert">
          A este link le falta información.{' '}
          <Link href="/forgot-password" className="link-sweep font-semibold underline">
            Pedí uno nuevo
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
