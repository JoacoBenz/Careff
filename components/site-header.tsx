import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Logo } from './logo';
import { HeaderNav } from './header-nav';

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="Inicio">
          <Logo />
        </Link>
        <HeaderNav loggedIn={Boolean(session?.user)} />
      </div>
    </header>
  );
}
