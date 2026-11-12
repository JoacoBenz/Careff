import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Logo } from './logo';
import { HeaderNav } from './header-nav';

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[#030712]/70 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Inicio" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <HeaderNav loggedIn={Boolean(session?.user)} />
      </div>
    </header>
  );
}
