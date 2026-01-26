'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

interface Props {
  children: React.ReactNode;
}

export default function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider 
      // Re-fetch session every 5 minutes to check if still valid
      refetchInterval={5 * 60}
      // Re-fetch when window is focused
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}