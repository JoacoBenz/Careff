import { withAuth, withValidation, apiError } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { carpoolPlanSchema } from '@/lib/validators';
import { planCarpool } from '@/lib/carpool';
import { buildDistanceFn, AddressNotFoundError, GeoProviderError } from '@/lib/geo';
import type { Prisma } from '@/app/generated/prisma/client';

function withCity(address: string, city?: string): string {
  return city ? `${address}, ${city}` : address;
}

export const POST = withAuth(
  withValidation(carpoolPlanSchema, async (_request, { session, data }) => {
    const destination = withCity(data.destination, data.city);
    const drivers = data.drivers.map((d) => ({ ...d, address: withCity(d.address, data.city) }));
    const passengers = data.passengers.map((p) => ({
      ...p,
      address: withCity(p.address, data.city),
    }));

    const totalCapacity = drivers.reduce((sum, d) => sum + d.capacity, 0);
    if (passengers.length > totalCapacity) {
      return apiError(
        'CAPACITY_EXCEEDED',
        `Hay ${passengers.length} pasajeros pero solo ${totalCapacity} asientos disponibles.`,
        422,
      );
    }

    let distance;
    try {
      distance = await buildDistanceFn([
        ...drivers.map((d) => d.address),
        ...passengers.map((p) => p.address),
        destination,
      ]);
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

    const result = planCarpool(drivers, passengers, destination, distance);

    const saved = await prisma.carpoolPlan.create({
      data: {
        userId: Number(session.user.id),
        title: data.title,
        destination,
        input: data as unknown as Prisma.InputJsonValue,
        result: result as unknown as Prisma.InputJsonValue,
      },
    });

    return Response.json({ id: saved.id, plan: result }, { status: 201 });
  }),
);

export const GET = withAuth(async (_request, { session }) => {
  const plans = await prisma.carpoolPlan.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, title: true, destination: true, result: true, createdAt: true },
  });
  return Response.json({ plans });
});
