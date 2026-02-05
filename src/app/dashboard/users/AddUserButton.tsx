'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddUserModal from '@/components/modals/AddUserModal';

interface AddUserButtonProps {
  allowedRoles: string[];
}

export default function AddUserButton({ allowedRoles }: AddUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary">
        <Plus className="w-5 h-5" />
        Add
      </button>
      <AddUserModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        allowedRoles={allowedRoles}
      />
    </>
  );
}
