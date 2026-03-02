import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from './prisma';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ---------------------------------------------------------------------------
// In-memory login rate limiter
// Limits to 5 failed attempts per IP per 15 minutes.
// Note: resets on server restart and does not share state across multiple
// instances. For multi-instance production deployments, replace the Map with
// a Redis-backed store (e.g. Upstash).
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_ATTEMPTS) return true;
  record.count++;
  return false;
}

function clearRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        // Rate limit by IP
        const ip =
          (request as Request | undefined)?.headers?.get('x-forwarded-for') ??
          (request as Request | undefined)?.headers?.get('x-real-ip') ??
          'unknown';

        if (isRateLimited(ip)) {
          throw new Error('Too many login attempts. Please try again in 15 minutes.');
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        try {
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user || user.status !== UserStatus.ACTIVE) return null;

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) return null;

          // Successful login — clear any recorded failures for this IP
          clearRateLimit(ip);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in — populate token from the user object
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.email = user.email;
        token.name = user.name;
        token.validatedAt = Date.now();
        return token;
      }

      // Subsequent requests — re-validate against DB every 30 minutes.
      // This is the correct place for token mutations: the jwt callback
      // return value is written back to the cookie, so role updates here
      // actually persist. Mutations made in the session callback do not.
      const lastValidated = token.validatedAt ?? 0;
      const thirtyMinutes = 30 * 60 * 1000;
      const shouldValidate = !!token.id && Date.now() - lastValidated > thirtyMinutes;

      if (shouldValidate) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { id: true, status: true, role: true },
          });

          if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
            token.invalidated = true;
          } else {
            token.role = dbUser.role;
            token.validatedAt = Date.now();
          }
        } catch (error) {
          console.error('JWT validation error:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.invalidated) {
        return { ...session, error: 'UserInvalidated' as const };
      }

      return {
        ...session,
        user: {
          id: token.id,
          email: token.email as string,
          name: token.name as string,
          role: token.role,
        },
      };
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  trustHost: true,
});