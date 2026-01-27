import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import SessionMonitor from '@/components/auth/SessionMonitor';

// Prevent caching to ensure fresh session check
// export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check for valid session with user data
  if (!session?.user?.id || (session as any)?.error === 'UserInvalidated') {
    redirect('/login?error=SessionExpired');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SessionMonitor />
      <Sidebar userRole={session.user.role} userName={session.user.name} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}