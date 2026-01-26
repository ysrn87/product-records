import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/actions/users';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Shield, 
  Calendar,
  UserCog,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import UserStatusToggle from './UserStatusToggle';

export default async function UserDetailPage({
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

  // Check if current user can view/edit this user
  const canEdit = 
    session.user.role === 'PRIVILEGE' || 
    (session.user.role === 'ADMIN' && ['SALES', 'WAREHOUSE'].includes(user.role));

  const roleDisplayNames: Record<string, string> = {
    PRIVILEGE: 'Super Admin',
    ADMIN: 'Admin',
    SALES: 'Sales',
    WAREHOUSE: 'Warehouse',
  };

  const roleColors: Record<string, string> = {
    PRIVILEGE: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    SALES: 'bg-green-100 text-green-800',
    WAREHOUSE: 'bg-orange-100 text-orange-800',
  };

  const isOwnAccount = session.user.id === user.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                {roleDisplayNames[user.role]}
              </span>
              {user.status === 'ACTIVE' ? (
                <span className="badge-success">Active</span>
              ) : (
                <span className="badge-gray">Inactive</span>
              )}
            </div>
            <p className="text-gray-500 mt-1">{user.email}</p>
          </div>
        </div>
        {canEdit && (
          <Link href={`/dashboard/users/${id}/edit`} className="btn-primary">
            <Edit className="w-4 h-4" />
            Edit User
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">User Information</h2>
          </div>
          <div className="card-body">
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <UserCog className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Full Name</dt>
                  <dd className="font-medium text-gray-900">{user.name}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Email Address</dt>
                  <dd className="font-medium text-gray-900">{user.email}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Phone Number</dt>
                  <dd className="font-medium text-gray-900">{user.phone || '-'}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Role</dt>
                  <dd>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {roleDisplayNames[user.role]}
                    </span>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Member Since</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDateTime(user.createdAt)}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Account Status</h2>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`w-3 h-3 rounded-full ${
                    user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="font-medium text-gray-900">
                  {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {user.status === 'ACTIVE'
                  ? 'This account can log in and access the system.'
                  : 'This account is disabled and cannot log in.'}
              </p>
              {canEdit && !isOwnAccount && (
                <UserStatusToggle 
                  userId={user.id} 
                  currentStatus={user.status} 
                />
              )}
              {isOwnAccount && (
                <p className="text-xs text-gray-400">
                  You cannot change your own account status.
                </p>
              )}
            </div>
          </div>

          {/* Role Permissions */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Role Permissions</h2>
            </div>
            <div className="card-body">
              <div className="text-sm text-gray-600 space-y-2">
                {user.role === 'PRIVILEGE' && (
                  <>
                    <p>✓ Full system access</p>
                    <p>✓ Manage all users</p>
                    <p>✓ View reports & analytics</p>
                    <p>✓ System settings</p>
                  </>
                )}
                {user.role === 'ADMIN' && (
                  <>
                    <p>✓ Manage products & variants</p>
                    <p>✓ Manage sales & warehouse users</p>
                    <p>✓ Record stock & sales</p>
                    <p>✓ View customers</p>
                  </>
                )}
                {user.role === 'SALES' && (
                  <>
                    <p>✓ Create sales transactions</p>
                    <p>✓ Manage customers</p>
                    <p>✓ Generate invoices</p>
                    <p>✓ View own sales history</p>
                  </>
                )}
                {user.role === 'WAREHOUSE' && (
                  <>
                    <p>✓ Record incoming stock</p>
                    <p>✓ View stock levels</p>
                    <p>✓ Low stock monitoring</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}