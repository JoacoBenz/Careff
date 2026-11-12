import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { LoginForm } from '@/components/login-form';
import { googleEnabled } from '@/lib/auth';
import { safeCallbackUrl } from '@/lib/safe-redirect';

export const metadata: Metadata = { title: 'Iniciar sesión' };

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string; reset?: string }>;
}

// Server page: reads the return path and what sign-in methods are configured,
// then hands off to the client form.
export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const query = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <AuthShell
      title="Hola de nuevo"
      subtitle="Entrá para ver tus grupos y planes guardados."
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link
            href={callbackUrl === '/' ? '/register' : `/register${query}`}
            className="link-sweep link-amber"
          >
            Crear cuenta gratis
          </Link>
        </>
      }
    >
      <LoginForm
        callbackUrl={callbackUrl}
        googleEnabled={googleEnabled}
        // Auth.js sends failed Google sign-ins back here with ?error=...
        initialError={
          params.error ? 'No pudimos iniciar sesión con Google. Probá de nuevo.' : undefined
        }
        notice={
          params.reset ? 'Contraseña actualizada. Ya podés ingresar con la nueva.' : undefined
        }
      />
    </AuthShell>
  );
}
