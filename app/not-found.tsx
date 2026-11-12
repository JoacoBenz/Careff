import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <p className="text-gradient rise text-8xl font-bold tracking-tighter">404</p>
        <h1 className="rise mt-4 text-3xl font-bold text-white">Esta página se bajó del auto</h1>
        <p className="rise mt-2 text-[var(--ink-dim)]">
          El link no existe o el plan fue eliminado. Podés armar uno nuevo en un minuto.
        </p>
        <div className="rise mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/planner" className="btn-glow rounded-xl px-6 py-3 text-base">
            Armar un viaje
          </Link>
          <Link href="/" className="btn-glass rounded-xl px-6 py-3 text-base font-semibold">
            Ir al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
