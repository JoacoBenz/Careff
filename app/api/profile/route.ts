import { withAuth, withValidation } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { profileRegionSchema } from '@/lib/validators';

// Save the logged-in user's default region (country + province) to their profile.
export const PATCH = withAuth(
  withValidation(profileRegionSchema, async (_request, { session, data }) => {
    await prisma.user.update({
      where: { id: Number(session.user.id) },
      data: {
        defaultCountry: data.country || null,
        defaultProvinceId: data.provinceId || null,
        defaultProvinceName: data.provinceName || null,
      },
    });
    return Response.json({ ok: true });
  }),
);
