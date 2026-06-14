import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// A valid bcrypt hash of a random string, compared against when the email isn't
// found, to equalize login timing (mitigates account enumeration).
const DUMMY_PASSWORD_HASH = '$2b$10$BNBgdme7OvXJHECmakC4pu0Pq4cpaQk21evpL0lFdjx2TZ8LM2x5.';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  // Required for self-hosted production (`next start`, Docker): Auth.js only
  // auto-trusts the request host on Vercel or in dev.
  trustHost: true,
  // A session cookie that can't be decrypted (stale, or signed with a previous
  // NEXTAUTH_SECRET) is benign — Auth.js just treats the request as logged out.
  // Don't spam the logs with it; surface every other auth error normally.
  logger: {
    error(error: Error) {
      if (error.name === 'JWTSessionError') return;
      console.error(error);
    },
  },
  // App-specific cookie name: stale `authjs.session-token` cookies left on
  // localhost by other projects otherwise fail decryption and spam
  // JWTSessionError on every request.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-careff.session-token'
          : 'careff.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email : null;
        const password = typeof credentials?.password === 'string' ? credentials.password : null;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Always run bcrypt.compare (against a dummy hash when the user is
        // absent) so response time doesn't leak whether the email exists.
        const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
        const valid = await bcrypt.compare(password, hash);
        if (!user || !valid) return null;

        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
