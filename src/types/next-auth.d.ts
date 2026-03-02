import { UserRole } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
    // Set when a session is invalidated (user deactivated or role changed).
    // The middleware reads this to force a logout redirect.
    error?: 'UserInvalidated';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    validatedAt?: number;
    invalidated?: boolean;
  }
}