import { randomBytes } from 'node:crypto';
import { withAuth, withValidation } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { createGroupSchema } from '@/lib/validators';

export const POST = withAuth(
  withValidation(createGroupSchema, async (_request, { session, data }) => {
    const group = await prisma.group.create({
      data: {
        name: data.name,
        ownerId: Number(session.user.id),
        inviteToken: randomBytes(9).toString('base64url'),
      },
    });
    return Response.json(
      { id: group.id, name: group.name, inviteToken: group.inviteToken },
      { status: 201 },
    );
  }),
);

export const GET = withAuth(async (_request, { session }) => {
  const groups = await prisma.group.findMany({
    where: { ownerId: Number(session.user.id) },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { members: true } } },
  });
  return Response.json({
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      inviteToken: g.inviteToken,
      memberCount: g._count.members,
      createdAt: g.createdAt,
    })),
  });
});
