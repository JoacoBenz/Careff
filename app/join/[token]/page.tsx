import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SiteHeader } from '@/components/site-header';
import { JoinGroupForm } from '@/components/join-group-form';

// Public: anyone with the invite link can add themselves to the group.
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const group = await prisma.group.findUnique({
    where: { inviteToken: token },
    include: { owner: { select: { name: true } }, _count: { select: { members: true } } },
  });
  if (!group) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <header className="mb-6 text-center">
          <p className="text-3xl">🚗</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {group.owner.name} te invitó a «{group.name}»
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {group._count.members} persona
            {group._count.members === 1 ? ' ya se sumó' : 's ya se sumaron'} · Decí desde dónde
            salís y si llevás auto. Sin registrarte, gratis.
          </p>
        </header>
        <JoinGroupForm token={token} groupName={group.name} />
      </main>
    </div>
  );
}
