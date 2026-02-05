'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import NewStockEntryModal from '@/components/modals/NewStockEntryModal';

interface NewStockEntryButtonProps {
  isWarehouse?: boolean;
}

export default function NewStockEntryButton({ isWarehouse = false }: NewStockEntryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary">
        <Plus className="w-5 h-5" />
        New
      </button>
      <NewStockEntryModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        isWarehouse={isWarehouse}
      />
    </>
  );
}
