import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { ProfileRegionForm } from '@/components/profile-region-form';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: {
      name: true,
      email: true,
      defaultCountry: true,
      defaultProvinceId: true,
      defaultProvinceName: true,
    },
  });
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <PageHeader eyebrow="Cuenta" title="Mi perfil" />
        <div className="surface rise mb-5 flex items-center gap-4 p-5 sm:p-6">
          <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-bold text-[#1c1003]">
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white">{user.name}</p>
            <p className="truncate text-sm text-[var(--ink-dim)]">{user.email}</p>
          </div>
        </div>
        <ProfileRegionForm
          initial={{
            country: user.defaultCountry ?? 'ar',
            provincia: user.defaultProvinceId ?? undefined,
            provinceName: user.defaultProvinceName ?? undefined,
          }}
        />
      </main>
    </div>
  );
}
