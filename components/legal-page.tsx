import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteHeader } from './site-header';
import { PageHeader } from './page-header';

/** Shared frame for the long-form legal pages (privacy, terms). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <PageHeader
          eyebrow="Legal"
          title={title}
          description={`Última actualización: ${updated}`}
        />
        <div className="surface space-y-7 p-6 text-sm leading-relaxed text-[var(--ink-dim)] sm:p-8">
          {children}
        </div>
        <p className="mt-6 flex justify-center gap-6 text-sm text-[var(--ink-faint)]">
          <Link href="/privacy" className="link-sweep hover:text-white">
            Privacidad
          </Link>
          <Link href="/terms" className="link-sweep hover:text-white">
            Términos
          </Link>
          <Link href="/" className="link-sweep hover:text-white">
            Inicio
          </Link>
        </p>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <div className="mt-2 space-y-2.5 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-slate-200 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

/** Contact for data requests; reads CONTACT_EMAIL at request time. */
export function ContactEmail({ email }: { email: string | undefined }) {
  if (!email) return <>el contacto publicado en este sitio</>;
  return (
    <a href={`mailto:${email}`} className="link-sweep link-amber">
      {email}
    </a>
  );
}
