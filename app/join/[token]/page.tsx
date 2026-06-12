import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PROFILE_COOKIE, parseProfileCookie } from '@/lib/profile-cookie';
import { SiteHeader } from '@/components/site-header';
import { JoinGroupForm, type JoinFormInitial } from '@/components/join-group-form';

// Public: anyone with the invite link can add themselves to the group.
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const group = await prisma.group.findUnique({
    where: { inviteToken: token },
    include: { owner: { select: { name: true } }, _count: { select: { members: true } } },
  });
  if (!group) notFound();

  // Prefill: logged-in users get their saved default address; anonymous
  // visitors get whatever they declared the first time (profile cookie).
  let initial: JoinFormInitial | null = null;
  const session = await auth();
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { name: true, defaultAddress: true },
    });
    if (user) initial = { name: user.name, address: user.defaultAddress ?? '' };
  }
  if (!initial) {
    const cookieStore = await cookies();
    const profile = parseProfileCookie(cookieStore.get(PROFILE_COOKIE)?.value);
    if (profile) {
      initial = {
        name: profile.name,
        address: profile.address,
        hasCar: profile.hasCar,
        seats: profile.seats,
      };
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <header className="mb-6 text-center">
          <p className="text-3xl">🚗</p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            {group.owner.name} te invitó a «{group.name}»
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {group._count.members} persona
            {group._count.members === 1 ? ' ya se sumó' : 's ya se sumaron'} · Decí desde dónde
            salís y si llevás auto. Sin registrarte, gratis.
          </p>
        </header>
        <JoinGroupForm token={token} groupName={group.name} initial={initial ?? undefined} />
      </main>
    </div>
  );
}
