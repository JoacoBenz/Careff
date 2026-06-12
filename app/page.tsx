import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">careff</h1>
      <p className="text-sm text-gray-500">
        Ejemplos:{' '}
        <Link href="/login" className="underline">
          /login
        </Link>{' '}
        · <code>POST /api/auth/register</code> · <code>GET /api/me</code> (protegido) ·{' '}
        <code>GET /api/health</code>
      </p>
    </main>
  );
}
