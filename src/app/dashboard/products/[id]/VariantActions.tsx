'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { deleteVariant, toggleVariantStatus } from '@/actions/products';
import toast from 'react-hot-toast';

interface VariantActionsProps {
  variantId: string;
  sku: string;
  isActive: boolean;
}

export default function VariantActions({ variantId, sku, isActive }: VariantActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteVariant(variantId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Variant deleted successfully');
      router.refresh();
    }
    setIsDeleting(false);
    setShowConfirm(false);
  };

  const handleToggle = async () => {
    setIsToggling(true);
    const result = await toggleVariantStatus(variantId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Variant ${isActive ? 'deactivated' : 'activated'}`);
      router.refresh();
    }
    setIsToggling(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        title={isActive ? 'Deactivate' : 'Activate'}
      >
        {isToggling ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : isActive ? (
          <ToggleRight className="w-4 h-4 text-green-500" />
        ) : (
          <ToggleLeft className="w-4 h-4 text-gray-400" />
        )}
      </button>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete variant"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </>
  );
}