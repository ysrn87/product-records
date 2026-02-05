'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddCustomerModal from '@/components/modals/AddCustomerModal';

export default function AddCustomerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary">
        <Plus className="w-5 h-5" />
        New
      </button>
      <AddCustomerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
