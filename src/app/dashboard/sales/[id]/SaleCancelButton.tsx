'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, Loader2 } from 'lucide-react';
import { cancelSale } from '@/actions/sales';
import toast from 'react-hot-toast';

export default function SaleCancelButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    const result = await cancelSale(saleId, 'Cancelled by admin');

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else { 
      toast.success('Sale cancelled and stock restored');
      router.refresh();
      setShowConfirm(false);
    }
    setIsLoading(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Cancel sale?</span>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="btn-danger text-sm py-1.5"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Yes, Cancel'
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
          className="btn-outline text-sm py-1.5"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setShowConfirm(true)} className="btn-danger">
      <XCircle className="w-4 h-4" />
      Cancel Sale
    </button>
  );
}
