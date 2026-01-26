'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, Loader2 } from 'lucide-react';
import { cancelStockEntry } from '@/actions/stock';
import toast from 'react-hot-toast';

export default function StockEntryCancelButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    const result = await cancelStockEntry(entryId, 'Cancelle by Admin');

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success('Stock entry cancelled and stock reversed');
      router.refresh();
      setShowConfirm(false); 
    }
    setIsLoading(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Cancel entry?</span>
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
      Cancel Entry
    </button>
  );
}
