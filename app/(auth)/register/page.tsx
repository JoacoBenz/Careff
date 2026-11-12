import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { RegisterForm } from '@/components/register-form';
import { googleEnabled } from '@/lib/auth';
import { safeCallbackUrl } from '@/lib/safe-redirect';

export const metadata: Metadata = { title: 'Crear cuenta' };

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // New accounts land on the planner unless they came from a specific page.
  const callbackUrl = safeCallbackUrl(params.callbackUrl, '/planner');

  return (
    <AuthShell
      title="Creá tu cuenta"
      subtitle="Gratis para siempre. Sin tarjeta de crédito."
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link
            href={
              params.callbackUrl
                ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : '/login'
            }
            className="link-sweep link-amber"
          >
            Iniciar sesión
          </Link>
        </>
      }
    >
      <RegisterForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
