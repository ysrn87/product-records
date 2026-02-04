'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddProductModal from '@/components/modals/AddProductModal';

export default function AddProductButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary">
        <Plus className="w-5 h-5" />
        Add Product
      </button>
      <AddProductModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
