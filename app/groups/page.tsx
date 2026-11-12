import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SiteHeader } from '@/components/site-header';
import { CreateGroupForm } from '@/components/create-group-form';
import { PageHeader } from '@/components/page-header';
import { ArrowRightIcon, CarIcon, UsersIcon } from '@/components/icons';

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const groups = await prisma.group.findMany({
    where: { ownerId: Number(session.user.id) },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { members: true } },
      members: { select: { hasCar: true, seats: true } },
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <PageHeader
          eyebrow="Grupos"
          title="Mis grupos"
          description="Creá un grupo, compartí el link y cada persona se suma sola diciendo si tiene auto y cuántos asientos libres."
        />

        <div className="surface rise mb-8 p-5 sm:p-6" style={{ ['--d' as string]: '80ms' }}>
          <h2 className="mb-3 font-semibold text-white">Nuevo grupo</h2>
          <CreateGroupForm />
        </div>

        {groups.length === 0 ? (
          <div className="surface-dashed p-10 text-center">
            <UsersIcon className="mx-auto h-9 w-9 text-[var(--ink-faint)]" />
            <p className="mt-3 font-medium text-white">Todavía no tenés grupos</p>
            <p className="mt-1 text-sm text-[var(--ink-dim)]">
              Ponele un nombre arriba — el del fútbol, el del cole, el de siempre.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group, i) => {
              const cars = group.members.filter((m) => m.hasCar).length;
              const seats = group.members.reduce((sum, m) => sum + m.seats, 0);
              return (
                <li
                  key={group.id}
                  className="rise"
                  style={{ ['--d' as string]: `${120 + i * 50}ms` }}
                >
                  <Link
                    href={`/groups/${group.id}`}
                    className="surface surface-link flex items-center justify-between gap-4 p-4 sm:p-5"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-amber-400/15 text-lg font-bold text-amber-300 ring-1 ring-amber-400/25">
                        {group.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">{group.name}</h3>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="chip">
                            <UsersIcon className="h-3.5 w-3.5" />
                            {group._count.members} integrante
                            {group._count.members === 1 ? '' : 's'}
                          </span>
                          <span className="chip">
                            <CarIcon className="h-3.5 w-3.5" />
                            {cars} con auto · {seats} asiento{seats === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 flex-none text-[var(--ink-faint)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
