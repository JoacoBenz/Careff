import { randomBytes } from 'node:crypto';
import {
  withAuth,
  withOptionalAuth,
  withValidation,
  apiError,
  type OptionalAuthContext,
} from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { carpoolPlanSchema, type CarpoolPlanInput } from '@/lib/validators';
import { planCarpool, withCity } from '@/lib/carpool';
import { buildDistanceFn, AddressNotFoundError, GeoProviderError } from '@/lib/geo';
import { enforceRateLimit } from '@/lib/rate-limit';
import type { Prisma } from '@/generated/prisma/client';

// Guest mode: anyone can compute a plan; only logged-in users get it saved
// (with a public share token).
export const POST = withOptionalAuth(
  withValidation<CarpoolPlanInput, OptionalAuthContext>(
    carpoolPlanSchema,
    async (request, { session, data }) => {
      // Each plan triggers up to ~41 external geocode/routing calls — throttle
      // to prevent amplification abuse against this server and the free providers.
      const limited = enforceRateLimit(request, 'carpool', { limit: 30, windowMs: 600_000 });
      if (limited) return limited;

      const destination = withCity(data.destination, data.city);
      const drivers = data.drivers.map((d) => ({ ...d, address: withCity(d.address, data.city) }));
      const passengers = data.passengers.map((p) => ({
        ...p,
        address: withCity(p.address, data.city),
      }));

      const totalCapacity = drivers.reduce((sum, d) => sum + d.capacity, 0);
      if (passengers.length > totalCapacity) {
        const pax =
          passengers.length === 1 ? 'Hay 1 pasajero' : `Hay ${passengers.length} pasajeros`;
        const seats =
          totalCapacity === 1
            ? 'solo 1 asiento disponible'
            : `solo ${totalCapacity} asientos disponibles`;
        return apiError('CAPACITY_EXCEEDED', `${pax} pero ${seats}.`, 422);
      }

      // Coordinates resolved by autocomplete skip geocoding (exact + fast).
      const hints = new Map<string, { lat: number; lon: number }>();
      if (data.coords) {
        for (const [address, c] of Object.entries(data.coords)) {
          hints.set(withCity(address, data.city), c);
        }
      }

      let distance;
      let coordsByAddress;
      try {
        ({ distance, coordsByAddress } = await buildDistanceFn(
          [...drivers.map((d) => d.address), ...passengers.map((p) => p.address), destination],
          hints,
          { country: data.country, provincia: data.provincia },
        ));
      } catch (error) {
        if (error instanceof AddressNotFoundError) {
          return apiError(
            'ADDRESS_NOT_FOUND',
            `No se encontró la dirección "${error.address}". Probá agregando ciudad y país.`,
            422,
          );
        }
        if (error instanceof GeoProviderError) {
          return apiError(
            'GEO_UNAVAILABLE',
            'El servicio de mapas no está disponible en este momento. Intentá de nuevo en unos minutos.',
            503,
          );
        }
        throw error;
      }

      const result = planCarpool(drivers, passengers, destination, distance, coordsByAddress);

      if (!session) {
        return Response.json({ plan: result, saved: false }, { status: 200 });
      }

      const saved = await prisma.carpoolPlan.create({
        data: {
          userId: Number(session.user.id),
          title: data.title,
          destination,
          input: data as unknown as Prisma.InputJsonValue,
          result: result as unknown as Prisma.InputJsonValue,
          shareToken: randomBytes(9).toString('base64url'),
        },
      });

      return Response.json(
        { id: saved.id, plan: result, saved: true, shareToken: saved.shareToken },
        { status: 201 },
      );
    },
  ),
);

export const GET = withAuth(async (_request, { session }) => {
  const plans = await prisma.carpoolPlan.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      destination: true,
      result: true,
      shareToken: true,
      createdAt: true,
    },
  });
  return Response.json({ plans });
});
