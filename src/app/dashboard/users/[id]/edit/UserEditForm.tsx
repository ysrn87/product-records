'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save, Eye, EyeOff, KeyRound } from 'lucide-react';
import { updateUser, resetPassword } from '@/actions/users';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
}

interface UserEditFormProps {
  user: User;
  allowedRoles: string[];
  isOwnAccount: boolean;
  currentUserRole: string;
}

export default function UserEditForm({ 
  user, 
  allowedRoles, 
  isOwnAccount,
  currentUserRole,
}: UserEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
  });

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await updateUser(user.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role as 'PRIVILEGE' | 'ADMIN' | 'SALES' | 'WAREHOUSE',
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('User updated successfully');
      router.push(`/dashboard/users/${user.id}`);
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsResettingPassword(true);
    const result = await resetPassword(user.id, newPassword);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Password reset successfully');
      setNewPassword('');
      setShowPasswordReset(false);
    }
    setIsResettingPassword(false);
  };

  const roleDisplayNames: Record<string, string> = {
    PRIVILEGE: 'Super Admin',
    ADMIN: 'Admin',
    SALES: 'Sales',
    WAREHOUSE: 'Warehouse',
  };

  // Can only change role if not own account or if PRIVILEGE
  const canChangeRole = !isOwnAccount || currentUserRole === 'PRIVILEGE';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2 card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Enter email address"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              {canChangeRole ? (
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  {allowedRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleDisplayNames[role]}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                  {roleDisplayNames[formData.role]}
                  <p className="text-xs text-gray-500 mt-1">
                    You cannot change your own role
                  </p>
                </div>
              )}
            </div>

            {/* Role Descriptions */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <h3 className="font-medium text-gray-900 mb-2">Role Permissions</h3>
              <ul className="space-y-1 text-gray-600">
                {allowedRoles.includes('PRIVILEGE') && (
                  <li>• <strong>Super Admin:</strong> Full system access including reports and settings</li>
                )}
                {allowedRoles.includes('ADMIN') && (
                  <li>• <strong>Admin:</strong> Manage products, variants, pricing, and users</li>
                )}
                <li>• <strong>Sales:</strong> Create sales, manage customers, generate invoices</li>
                <li>• <strong>Warehouse:</strong> Record incoming stock, view stock levels</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link href={`/dashboard/users/${user.id}`} className="btn-secondary">
                Cancel
              </Link>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Password Reset Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Reset Password</h2>
          </div>
          <div className="card-body">
            {showPasswordReset ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetPassword}
                    disabled={isResettingPassword || newPassword.length < 6}
                    className="btn-primary text-sm flex-1"
                  >
                    {isResettingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Reset'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword('');
                    }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Reset this user's password to a new one.
                </p>
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="btn-outline w-full text-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Account Status</h2>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="font-medium text-gray-900">
                {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {user.status === 'ACTIVE'
                ? 'This account can log in and access the system.'
                : 'This account is disabled and cannot log in.'}
            </p>
            <p className="text-xs text-gray-400 mt-3">
              To change status, use the toggle button on the user detail page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}