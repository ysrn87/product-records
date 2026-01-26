'use client';

import { useState } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { toggleProductStatus } from '@/actions/products';
import toast from 'react-hot-toast';

interface ProductActionsProps {
  product: {
    id: string;
    isActive: boolean;
  };
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const result = await toggleProductStatus(product.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(product.isActive ? 'Product deactivated' : 'Product activated');
      }
    } catch {
      toast.error('Failed to update product status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleStatus}
      disabled={isLoading}
      className={`p-2 rounded-lg transition-colors ${
        product.isActive
          ? 'hover:bg-red-50 text-red-500'
          : 'hover:bg-green-50 text-green-500'
      }`}
      title={product.isActive ? 'Deactivate' : 'Activate'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Power className="w-4 h-4" />
      )}
    </button>
  );
}
