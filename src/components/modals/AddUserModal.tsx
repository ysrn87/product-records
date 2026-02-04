'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createUser } from '@/actions/users';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowedRoles: string[];
}

export default function AddUserModal({ isOpen, onClose, allowedRoles }: AddUserModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      phone: (formData.get('phone') as string) || undefined,
      role: formData.get('role') as 'PRIVILEGE' | 'ADMIN' | 'SALES' | 'WAREHOUSE',
    });

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success('User created successfully');
      onClose();
      router.refresh();
    }
  };

  const handleClose = () => {
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New User"
      description="Create a new user account"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Enter full name"
            autoFocus
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
            name="email"
            required
            placeholder="Enter email address"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              required
              minLength={6}
              placeholder="Enter password"
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
          <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="Enter phone number"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select id="role" name="role" required>
            <option value="">Select a role</option>
            {allowedRoles.includes('ADMIN') && (
              <option value="ADMIN">Admin</option>
            )}
            {allowedRoles.includes('SALES') && (
              <option value="SALES">Sales</option>
            )}
            {allowedRoles.includes('WAREHOUSE') && (
              <option value="WAREHOUSE">Warehouse</option>
            )}
          </select>
        </div>

        {/* Role Descriptions */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <h3 className="font-medium text-gray-900 mb-2">Role Permissions</h3>
          <ul className="space-y-1 text-gray-600">
            {allowedRoles.includes('ADMIN') && (
              <li>• <strong>Admin:</strong> Manage products, variants, pricing, and users</li>
            )}
            <li>• <strong>Sales:</strong> Create sales, manage customers, generate invoices</li>
            <li>• <strong>Warehouse:</strong> Record incoming stock, view stock levels</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
