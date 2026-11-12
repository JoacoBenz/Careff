import NextAuth, { CredentialsSignin } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { env } from './env';
import { logSecurityEvent } from './logger';
import { prisma } from './prisma';
import { clientIp, rateLimit } from './rate-limit';

// A valid bcrypt hash of a random string, compared against when the email isn't
// found, to equalize login timing (mitigates account enumeration).
const DUMMY_PASSWORD_HASH = '$2b$10$BNBgdme7OvXJHECmakC4pu0Pq4cpaQk21evpL0lFdjx2TZ8LM2x5.';

/** Google sign-in is offered only when its credentials are configured. */
export const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

// Surfaces to the client as `code: 'rate_limited'` so the form can say why.
class RateLimitedSignin extends CredentialsSignin {
  code = 'rate_limited';
}

const LOGIN_WINDOW = { limit: 10, windowMs: 15 * 60 * 1000 };

/**
 * Finds the account for a Google-verified email, or creates one. Matching is
 * by email: Google has proven the person owns the address.
 */
async function findOrCreateGoogleUser(email: string, name: string) {
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (!existing) {
    return prisma.user.create({ data: { email, name, emailVerified: new Date() } });
  }
  if (existing.emailVerified) return existing;
  // The address was never confirmed, so whoever set the password may not be
  // its owner (someone can pre-register a victim's email). Drop that password
  // now that the real owner has shown up; they can set a new one by reset.
  if (existing.passwordHash) {
    logSecurityEvent('google_link_cleared_unverified_password', { userId: existing.id });
  }
  return prisma.user.update({
    where: { id: existing.id },
    data: { emailVerified: new Date(), passwordHash: null },
  });
}

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials, request) {
      const email = typeof credentials?.email === 'string' ? credentials.email : null;
      const password = typeof credentials?.password === 'string' ? credentials.password : null;
      if (!email || !password) return null;

      // Throttle guessing per network address and per targeted account.
      const byIp = rateLimit(`login-ip:${clientIp(request)}`, LOGIN_WINDOW);
      const byEmail = rateLimit(`login-email:${email.toLowerCase()}`, LOGIN_WINDOW);
      if (!byIp.ok || !byEmail.ok) {
        logSecurityEvent('login_rate_limited', { ip: clientIp(request) });
        throw new RateLimitedSignin();
      }

      const user = await prisma.user.findUnique({ where: { email } });
      // Always run bcrypt.compare (against a dummy hash when the user is
      // absent or has no password) so response time doesn't leak whether the
      // email exists.
      const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
      const valid = await bcrypt.compare(password, hash);
      if (!user || !user.passwordHash || !valid) return null;

      return { id: String(user.id), email: user.email, name: user.name };
    },
  }),
];

if (googleEnabled) {
  providers.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }));
}

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
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true;
      // Only accept addresses Google itself has verified.
      return Boolean(profile?.email && profile.email_verified === true);
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        // Runs once, at sign-in: map the Google identity to our own user row
        // so token.id is always a Careff user id (never Google's subject id).
        const dbUser = await findOrCreateGoogleUser(
          profile.email,
          profile.name?.trim() || profile.email.split('@')[0],
        );
        token.id = String(dbUser.id);
        token.name = dbUser.name;
        token.email = dbUser.email;
      } else if (user) {
        token.id = user.id;
      }
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
