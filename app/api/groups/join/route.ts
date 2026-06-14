import {
  apiError,
  withOptionalAuth,
  withValidation,
  type OptionalAuthContext,
} from '@/lib/api-handler';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { joinGroupSchema, type JoinGroupInput } from '@/lib/validators';
import { PROFILE_COOKIE } from '@/lib/profile-cookie';
import { enforceRateLimit } from '@/lib/rate-limit';

const MAX_MEMBERS = 40;

// Public: members join through the invite link, no account needed.
export const POST = withOptionalAuth(
  withValidation<JoinGroupInput, OptionalAuthContext>(
    joinGroupSchema,
    async (request, { session, data }) => {
      const limited = enforceRateLimit(request, 'join', { limit: 20, windowMs: 600_000 });
      if (limited) return limited;

      const group = await prisma.group.findUnique({
        where: { inviteToken: data.token },
        include: { _count: { select: { members: true } } },
      });
      if (!group) {
        return apiError('GROUP_NOT_FOUND', 'El link de invitación no es válido.', 404);
      }

      // Re-joining (same name + address) updates the existing row instead of
      // duplicating it; the full-group check only applies to genuinely new members.
      const seats = data.hasCar ? data.seats : 0;
      const existing = await prisma.groupMember.findUnique({
        where: {
          groupId_name_address: { groupId: group.id, name: data.name, address: data.address },
        },
      });
      if (!existing && group._count.members >= MAX_MEMBERS) {
        return apiError('GROUP_FULL', 'El grupo ya alcanzó el máximo de integrantes.', 422);
      }

      const member = await prisma.groupMember.upsert({
        where: {
          groupId_name_address: { groupId: group.id, name: data.name, address: data.address },
        },
        update: { hasCar: data.hasCar, seats, lat: data.lat, lon: data.lon },
        create: {
          groupId: group.id,
          name: data.name,
          address: data.address,
          hasCar: data.hasCar,
          seats,
          lat: data.lat,
          lon: data.lon,
        },
      });

      // The FIRST departure address someone declares becomes their default
      // (updateMany with defaultAddress: null makes later joins no-ops).
      if (session) {
        await prisma.user.updateMany({
          where: { id: Number(session.user.id), defaultAddress: null },
          data: { defaultAddress: data.address },
        });
      }

      // Anonymous members get the same memory via a long-lived cookie.
      const cookieStore = await cookies();
      if (!cookieStore.get(PROFILE_COOKIE)) {
        cookieStore.set(
          PROFILE_COOKIE,
          encodeURIComponent(
            JSON.stringify({
              name: data.name,
              address: data.address,
              hasCar: data.hasCar,
              seats: data.hasCar ? data.seats : 0,
            }),
          ),
          { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax', httpOnly: true },
        );
      }

      return Response.json({ id: member.id, groupName: group.name }, { status: 201 });
    },
  ),
);
