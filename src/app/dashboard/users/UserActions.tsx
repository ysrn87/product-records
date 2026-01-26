'use client';

import { useState } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { toggleUserStatus } from '@/actions/users';
import toast from 'react-hot-toast';

interface UserActionsProps {
  user: {
    id: string;
    role: string;
    status: string;
  };
  currentUserRole: string;
}

export default function UserActions({ user, currentUserRole }: UserActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Privilege can manage Admin, Admin can manage Sales/Warehouse
  const canManage = currentUserRole === 'PRIVILEGE' ||
    (currentUserRole === 'ADMIN' && ['SALES', 'WAREHOUSE'].includes(user.role));

  if (!canManage) return null;

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const result = await toggleUserStatus(user.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          user.status === 'ACTIVE' ? 'User deactivated' : 'User activated'
        );
      }
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleStatus}
      disabled={isLoading}
      className={`p-2 rounded-lg transition-colors ${
        user.status === 'ACTIVE'
          ? 'hover:bg-red-50 text-red-500'
          : 'hover:bg-green-50 text-green-500'
      }`}
      title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Power className="w-4 h-4" />
      )}
    </button>
  );
}
