'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteProduct } from '@/actions/products';
import toast from 'react-hot-toast';

interface ProductDeleteButtonProps {
  productId: string;
  productName: string;
}

export default function ProductDeleteButton({ productId, productName }: ProductDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProduct(productId);

    if (result.error) {
      toast.error(result.error);
      setIsDeleting(false);
      setShowConfirm(false);
    } else {
      toast.success('Product deleted successfully');
      router.push('/dashboard/products');
      router.refresh();
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Delete "{productName}"?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="btn-danger text-sm py-1.5"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="btn-outline text-sm py-1.5"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setShowConfirm(true)} className="btn-danger">
      <Trash2 className="w-4 h-4" />
      Delete Product
    </button>
  );
}