// src/components/auth/SessionMonitor.tsx

'use client';

import { useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SessionMonitor() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    toast.error('Your session has expired. Please log in again.');
    signOut({ callbackUrl: '/login?error=SessionExpired' });
  }, []);

  // Check if session has UserInvalidated error
  useEffect(() => {
    if ((session as any)?.error === 'UserInvalidated') {
      handleLogout();
    }
  }, [session, handleLogout]);

  // If session becomes unauthenticated unexpectedly
  useEffect(() => {
    if (status === 'unauthenticated' && window.location.pathname.startsWith('/dashboard')) {
      router.push('/login');
    }
  }, [status, router]);

  // CHANGED: Refresh session every 30 minutes instead of 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'authenticated') {
        update();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [status, update]);

  // REMOVED: Window focus check - too aggressive
  // Users won't be deleted while actively using the app

  return null;
}