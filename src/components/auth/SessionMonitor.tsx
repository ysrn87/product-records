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

  // Check if session has UserInvalidated error (user deleted/deactivated)
  useEffect(() => {
    if ((session as any)?.error === 'UserInvalidated') {
      handleLogout();
    }
  }, [session, handleLogout]);

  // If session becomes unauthenticated unexpectedly while on dashboard
  useEffect(() => {
    if (status === 'unauthenticated' && window.location.pathname.startsWith('/dashboard')) {
      router.push('/login');
    }
  }, [status, router]);

  // Periodically refresh session to check validity (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'authenticated') {
        update();
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [status, update]);

  // Check session on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        update();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, update]);

  return null;
}