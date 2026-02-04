import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUsers } from '@/actions/users';
import { formatDateTime, roleDisplayNames } from '@/lib/utils';
import Link from 'next/link';
import { Users, Search, Edit } from 'lucide-react';
import UserActions from './UserActions';
import AddUserButton from './AddUserButton';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const users = await getUsers();
  const allowedRoles = session.user.role === 'PRIVILEGE'
  ? ['ADMIN', 'SALES', 'WAREHOUSE']
  : ['SALES', 'WAREHOUSE'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">
            Manage user accounts and access
          </p>
        </div>
        <AddUserButton allowedRoles={allowedRoles} />
      </div>
      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <form className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by name or email..."
                  defaultValue={params.search}
                  className="w-full h-11 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm placeholder:text-gray-500"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="sm:w-44">
              <select
                name="role"
                defaultValue={params.role || ''}
                className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">All Roles</option>
                {session.user.role === 'PRIVILEGE' && (
                  <option value="ADMIN">Admin</option>
                )}
                <option value="SALES">Sales</option>
                <option value="WAREHOUSE">Warehouse</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="btn-primary h-11 px-8 whitespace-nowrap text-sm font-medium"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                    <Link
                      href="/dashboard/users/new"
                      className="text-primary-600 hover:underline mt-2 inline-block"
                    >
                      Add your first user
                    </Link>
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-${user.role === 'PRIVILEGE' ? 'primary' :
                          user.role === 'ADMIN' ? 'warning' :
                            user.role === 'SALES' ? 'success' : 'gray'
                        }`}>
                        {roleDisplayNames[user.role]}
                      </span>
                    </td>
                    <td>
                      {user.status === 'ACTIVE' ? (
                        <span className="badge-success">Active</span>
                      ) : (
                        <span className="badge-gray">Inactive</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/users/${user.id}/edit`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Link>
                        <UserActions user={user} currentUserRole={session.user.role} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
