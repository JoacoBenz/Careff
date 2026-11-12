import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { idSchema } from '@/lib/validators';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
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
    lat: m.lat,
    lon: m.lon,
  }));

  // The owner's saved region defaults the planner's address autocomplete.
  const owner = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { defaultCountry: true, defaultProvinceId: true, defaultProvinceName: true },
  });
  const initialRegion = owner?.defaultCountry
    ? {
        country: owner.defaultCountry,
        provincia: owner.defaultProvinceId ?? undefined,
        provinceName: owner.defaultProvinceName ?? undefined,
      }
    : undefined;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/groups"
          className="link-sweep mb-4 inline-block text-sm text-[var(--ink-dim)] hover:text-white"
        >
          ← Mis grupos
        </Link>
        <PageHeader
          eyebrow="Grupo"
          title={group.name}
          description={`${members.length} integrante${members.length === 1 ? '' : 's'}`}
        />

        <div className="space-y-6">
          <InviteBox inviteUrl={inviteUrl} groupName={group.name} />

          <section>
            <h2 className="mb-3 font-semibold text-white">Integrantes</h2>
            <MemberList groupId={group.id} members={members} />
          </section>

          <GroupPlanner groupName={group.name} members={members} initialRegion={initialRegion} />
        </div>
      </main>
    </div>
  );
}
