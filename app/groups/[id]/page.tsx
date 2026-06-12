import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { idSchema } from '@/lib/validators';
import { SiteHeader } from '@/components/site-header';
import { InviteBox, MemberList, GroupPlanner } from '@/components/group-detail';

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const groupId = idSchema.safeParse(id);
  if (!groupId.success) notFound();

  // Owner-only view: the group is managed by whoever created it.
  const group = await prisma.group.findFirst({
    where: { id: groupId.data, ownerId: Number(session.user.id) },
    include: { members: { orderBy: { createdAt: 'asc' } } },
  });
  if (!group) notFound();

  const requestHeaders = await headers();
  const host = requestHeaders.get('host') ?? 'localhost:3000';
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const inviteUrl = `${protocol}://${host}/join/${group.inviteToken}`;

  const members = group.members.map((m) => ({
    id: m.id,
    name: m.name,
    address: m.address,
    hasCar: m.hasCar,
    seats: m.seats,
  }));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
            <p className="text-sm text-slate-500">
              {members.length} integrante{members.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link href="/groups" className="text-sm text-slate-500 underline">
            ← Mis grupos
          </Link>
        </header>

        <InviteBox inviteUrl={inviteUrl} groupName={group.name} />

        <section>
          <h2 className="mb-3 font-semibold text-slate-900">Integrantes</h2>
          <MemberList groupId={group.id} members={members} />
        </section>

        <GroupPlanner groupName={group.name} members={members} />
      </main>
    </div>
  );
}
