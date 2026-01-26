import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NewUserForm from './NewUserForm';

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const allowedRoles = session.user.role === 'PRIVILEGE'
    ? ['ADMIN', 'SALES', 'WAREHOUSE']
    : ['SALES', 'WAREHOUSE'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/users"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New User</h1>
          <p className="text-gray-500 mt-1">Create a new user account</p>
        </div>
      </div>

      {/* Form */}
      <NewUserForm allowedRoles={allowedRoles} />
    </div>
  );
}