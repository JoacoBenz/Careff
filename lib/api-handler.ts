import type { Session } from 'next-auth';
import type { ZodType } from 'zod';
import { auth } from './auth';
import { logApiError } from './logger';

// withAuth rejects requests without session.user, so handlers can rely on it.
export type AuthenticatedSession = Session & { user: NonNullable<Session['user']> };

interface HandlerContext {
  session: AuthenticatedSession;
}

// For routes usable both logged-in and as guest (session may be null).
export interface OptionalAuthContext {
  session: AuthenticatedSession | null;
}

type ApiHandler<TParams = unknown> = (
  request: Request,
  context: HandlerContext,
  params?: TParams,
) => Promise<Response>;

export function apiError(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

/**
 * Wraps a route handler with authentication and uniform error handling.
 *
 *   export const GET = withAuth(async (request, { session }) => { ... });
 */
export function withAuth<TParams>(handler: ApiHandler<TParams>) {
  return async (request: Request, routeParams?: TParams): Promise<Response> => {
    try {
      const session = await auth();
      if (!session?.user) {
        return apiError('UNAUTHORIZED', 'Sesión expirada. Iniciá sesión nuevamente.', 401);
      }
      return await handler(request, { session: session as AuthenticatedSession }, routeParams);
    } catch (error) {
      const url = new URL(request.url);
      logApiError(url.pathname, request.method, error);
      return apiError('INTERNAL', 'Error interno del servidor', 500);
    }
  };
}

/**
 * Like withAuth but lets the request through without a session: the handler
 * receives session: null for guests. Same uniform error handling.
 *
 *   export const POST = withOptionalAuth(async (request, { session }) => { ... });
 */
export function withOptionalAuth<TParams>(
  handler: (request: Request, context: OptionalAuthContext, params?: TParams) => Promise<Response>,
) {
  return async (request: Request, routeParams?: TParams): Promise<Response> => {
    try {
      const session = await auth();
      const authenticated = session?.user ? (session as AuthenticatedSession) : null;
      return await handler(request, { session: authenticated }, routeParams);
    } catch (error) {
      const url = new URL(request.url);
      logApiError(url.pathname, request.method, error);
      return apiError('INTERNAL', 'Error interno del servidor', 500);
    }
  };
}

/**
 * Parses and validates the JSON body against a Zod schema before invoking the
 * handler. Compose with withAuth (default) or withOptionalAuth (pass the
 * context type explicitly):
 *
 *   export const POST = withAuth(
 *     withValidation(registerSchema, async (request, { session, data }) => { ... }),
 *   );
 */
export function withValidation<TBody, TContext extends object = HandlerContext, TParams = unknown>(
  schema: ZodType<TBody>,
  handler: (
    request: Request,
    context: TContext & { data: TBody },
    params?: TParams,
  ) => Promise<Response>,
): (request: Request, context: TContext, params?: TParams) => Promise<Response> {
  return async (request, context, params) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
    }
    const result = schema.safeParse(body);
    if (!result.success) {
      return Response.json(
        {
          error: {
            code: 'VALIDATION',
            message: 'Invalid request body',
            issues: result.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        { status: 400 },
      );
    }
    return handler(request, { ...context, data: result.data }, params);
  };
}
