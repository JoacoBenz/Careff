import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SiteHeader } from '@/components/site-header';
import { CreateGroupForm } from '@/components/create-group-form';

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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Mis grupos</h1>
          <p className="text-sm text-slate-400">
            Creá un grupo, compartí el link y cada persona se suma sola diciendo si tiene auto y
            cuántos asientos libres.
          </p>
        </header>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Nuevo grupo</h2>
          <CreateGroupForm />
        </div>

        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Todavía no tenés grupos. Creá el primero arriba 👆
          </p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => {
              const cars = group.members.filter((m) => m.hasCar).length;
              const seats = group.members.reduce((sum, m) => sum + m.seats, 0);
              return (
                <li key={group.id}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900">{group.name}</h3>
                      <p className="text-sm text-slate-500">
                        {group._count.members} integrante{group._count.members === 1 ? '' : 's'} ·{' '}
                        🚗 {cars} con auto · {seats} asiento{seats === 1 ? '' : 's'} en total
                      </p>
                    </div>
                    <span className="text-slate-400">→</span>
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
