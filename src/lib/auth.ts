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
        token.validatedAt = Date.now();
      }
      return token;
    },
    
    async session({ session, token }) {
      // Only validate user from DB every 30 minutes
      const lastValidated = (token.validatedAt as number) || 0;
      const thirtyMinutes = 30 * 60 * 1000;
      const shouldValidate = Date.now() - lastValidated > thirtyMinutes;
      
      if (shouldValidate) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, status: true, role: true },
          });
          
          if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
            return {
              ...session,
              user: null,
              error: 'UserInvalidated',
            } as any;
          }
          
          // Update token if role changed
          if (dbUser.role !== token.role) {
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('Session validation error:', error);
        }
      }
      
      // Always return user data from token (validated or not)
      return {
        ...session,
        user: {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as UserRole,
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