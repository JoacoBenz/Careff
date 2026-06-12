import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validators';
import { apiError } from '@/lib/api-handler';
import { logApiError } from '@/lib/logger';

// Public endpoint (no withAuth): creates an account. Example of the standard
// shape for unauthenticated routes — validate, act, structured errors.
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('INVALID_JSON', 'El cuerpo debe ser JSON válido', 400);
    }
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        {
          error: {
            code: 'VALIDATION',
            message: 'Datos inválidos',
            issues: result.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        { status: 400 },
      );
    }

    const { email, name, password } = result.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError('EMAIL_TAKEN', 'Ya existe una cuenta con ese email', 409);
    }

    const user = await prisma.user.create({
      data: { email, name, passwordHash: await bcrypt.hash(password, 10) },
    });
    return Response.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (error) {
    logApiError('/api/auth/register', 'POST', error);
    return apiError('INTERNAL', 'Error interno del servidor', 500);
  }
}
