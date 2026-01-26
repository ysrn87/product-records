'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toggleUserStatus } from '@/actions/users';
import toast from 'react-hot-toast';

interface UserStatusToggleProps {
  userId: string;
  currentStatus: string;
}

export default function UserStatusToggle({ userId, currentStatus }: UserStatusToggleProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    const action = currentStatus === 'ACTIVE' ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    setIsLoading(true);
    const result = await toggleUserStatus(userId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`User ${action}d successfully`);
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={currentStatus === 'ACTIVE' ? 'btn-danger w-full' : 'btn-success w-full'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : currentStatus === 'ACTIVE' ? (
        'Deactivate Account'
      ) : (
        'Activate Account'
      )}
    </button>
  );
}