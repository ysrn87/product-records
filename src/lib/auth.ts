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

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || user.status !== UserStatus.ACTIVE) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return null;
          }

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
      // Initial sign in - set user data
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Validate user exists and is active on EVERY session call
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
          },
        });

        // User doesn't exist or is inactive - invalidate session
        if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
          return {
            ...session,
            user: null,
            error: 'UserInvalidated',
          } as any;
        }

        // Always set user data from DB (handles initial login and role changes)
        return {
          ...session,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
        };
      } catch (error) {
        console.error('Session validation error:', error);
        // On database error, use token data as fallback instead of invalidating
        // This prevents logout on temporary DB issues
        return {
          ...session,
          user: {
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
            role: token.role as UserRole,
          },
        };
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  trustHost: true,
});