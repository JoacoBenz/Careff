import {
  apiError,
  withOptionalAuth,
  withValidation,
  type OptionalAuthContext,
} from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { joinGroupSchema, type JoinGroupInput } from '@/lib/validators';

const MAX_MEMBERS = 40;

// Public: members join through the invite link, no account needed.
export const POST = withOptionalAuth(
  withValidation<JoinGroupInput, OptionalAuthContext>(
    joinGroupSchema,
    async (_request, { data }) => {
      const group = await prisma.group.findUnique({
        where: { inviteToken: data.token },
        include: { _count: { select: { members: true } } },
      });
      if (!group) {
        return apiError('GROUP_NOT_FOUND', 'El link de invitación no es válido.', 404);
      }
      if (group._count.members >= MAX_MEMBERS) {
        return apiError('GROUP_FULL', 'El grupo ya alcanzó el máximo de integrantes.', 422);
      }

      const member = await prisma.groupMember.create({
        data: {
          groupId: group.id,
          name: data.name,
          address: data.address,
          hasCar: data.hasCar,
          seats: data.hasCar ? data.seats : 0,
        },
      });

      return Response.json({ id: member.id, groupName: group.name }, { status: 201 });
    },
  ),
);
