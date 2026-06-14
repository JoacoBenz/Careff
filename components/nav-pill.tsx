'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Header navigation pill: glass capsule that glows amber when its route is
 * active, warms up on hover otherwise.
 */
export function NavPill({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full border border-amber-400/40 bg-amber-400/15 px-3.5 py-1.5 text-sm font-medium text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.25)]'
          : 'rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-white/10 hover:text-white'
      }
    >
      {children}
    </Link>
  );
}
