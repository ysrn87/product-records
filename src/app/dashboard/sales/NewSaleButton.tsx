'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import NewSaleModal from '@/components/modals/NewSaleModal';

export default function NewSaleButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary">
        <Plus className="w-5 h-5" />
        New
      </button>
      <NewSaleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
