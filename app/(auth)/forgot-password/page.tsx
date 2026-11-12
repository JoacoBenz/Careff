import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperá tu cuenta"
      subtitle="Decinos tu email y te mandamos un link para elegir una nueva contraseña."
      footer={
        <>
          ¿Te acordaste?{' '}
          <Link href="/login" className="link-sweep link-amber">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
