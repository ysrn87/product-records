import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/actions/users';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UserEditForm from './UserEditForm';

export default async function UserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  // Check if current user can edit this user
  const canEdit = 
    session.user.role === 'PRIVILEGE' || 
    (session.user.role === 'ADMIN' && ['SALES', 'WAREHOUSE'].includes(user.role));

  if (!canEdit) {
    redirect('/dashboard/users');
  }

  // Determine allowed roles based on current user
  const allowedRoles = session.user.role === 'PRIVILEGE'
    ? ['PRIVILEGE', 'ADMIN', 'SALES', 'WAREHOUSE']
    : ['SALES', 'WAREHOUSE'];

  // Prevent changing own role to lower level
  const isOwnAccount = session.user.id === user.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/users/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-500 mt-1">{user.name}</p>
        </div>
      </div>

      {/* Form */}
      <UserEditForm 
        user={user} 
        allowedRoles={allowedRoles} 
        isOwnAccount={isOwnAccount}
        currentUserRole={session.user.role}
      />
    </div>
  );
}