import { withAuth } from '@/lib/api-handler';

// Example of a protected endpoint: withAuth handles session, errors, logging.
export const GET = withAuth(async (_request, { session }) => {
  return Response.json({ user: session.user });
});
