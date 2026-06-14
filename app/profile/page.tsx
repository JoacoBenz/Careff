import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SiteHeader } from '@/components/site-header';
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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
          <p className="text-sm text-slate-400">
            {user.name} · {user.email}
          </p>
        </header>
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
