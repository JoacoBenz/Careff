import { apiError, withAuth } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { idSchema } from '@/lib/validators';

type RouteParams = { params: Promise<{ id: string; memberId: string }> };

// Only the group owner can remove members.
export const DELETE = withAuth<RouteParams>(async (_request, { session }, routeParams) => {
  const raw = await routeParams?.params;
  const groupId = idSchema.safeParse(raw?.id);
  const memberId = idSchema.safeParse(raw?.memberId);
  if (!groupId.success || !memberId.success) {
    return apiError('VALIDATION', 'Identificadores inválidos', 400);
  }

  const group = await prisma.group.findFirst({
    where: { id: groupId.data, ownerId: Number(session.user.id) },
    select: { id: true },
  });
  if (!group) {
    return apiError('NOT_FOUND', 'Grupo no encontrado', 404);
  }

  await prisma.groupMember.deleteMany({ where: { id: memberId.data, groupId: group.id } });
  return Response.json({ ok: true });
});
