import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Add this line to use Node.js runtime
export const runtime = 'nodejs';

export default auth((req) => {
  const session = req.auth;
  const hasValidUser = session?.user?.id;
  const hasError = (session as any)?.error === 'UserInvalidated';
  const { pathname } = req.nextUrl;

  // If session has UserInvalidated error, force logout
  if (hasError) {
    const loginUrl = new URL('/login', req.nextUrl);
    loginUrl.searchParams.set('error', 'SessionExpired');
    
    const response = NextResponse.redirect(loginUrl);
    
    // Clear all possible session cookies
    const cookiesToClear = [
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'authjs.csrf-token',
      '__Secure-authjs.csrf-token',
      'authjs.callback-url',
      '__Secure-authjs.callback-url',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
    ];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
      });
    });
    
    return response;
  }

  // Protected routes - require valid session with user
  if (pathname.startsWith('/dashboard')) {
    if (!hasValidUser) {
      const loginUrl = new URL('/login', req.nextUrl);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login' && hasValidUser) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Redirect root to dashboard or login
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(hasValidUser ? '/dashboard' : '/login', req.nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};