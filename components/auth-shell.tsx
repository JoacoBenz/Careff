import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from './logo';
import { CheckIcon } from './icons';
import { HeroVisual } from './hero-visual';

const PERKS = [
  'Guardá cada plan y volvé a usarlo',
  'Link público para compartir con el grupo',
  'Grupos que se arman solos por invitación',
];

/**
 * Split layout for login/register: the form on one side, the product pitch
 * (with the live route visual) on the other. Collapses to the form alone on
 * small screens so the keyboard never fights the illustration.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <div className="rise mx-auto w-full max-w-sm">
        <Link href="/" aria-label="Inicio" className="inline-block">
          <Logo />
        </Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-1.5 text-sm text-[var(--ink-dim)]">{subtitle}</p>
        <div className="surface mt-6 p-6">{children}</div>
        <p className="mt-5 text-center text-sm text-[var(--ink-dim)]">{footer}</p>
      </div>

      <aside className="rise hidden lg:block" style={{ ['--d' as string]: '120ms' }}>
        <HeroVisual />
        <ul className="mx-auto mt-8 max-w-sm space-y-2.5 text-sm text-[var(--ink-dim)]">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                <CheckIcon className="h-3 w-3" strokeWidth={3} />
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
