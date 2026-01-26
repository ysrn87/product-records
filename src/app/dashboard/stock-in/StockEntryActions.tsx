'use client';

import { useState } from 'react';
import { XCircle, Loader2, X } from 'lucide-react';
import { cancelStockEntry } from '@/actions/stock';
import toast from 'react-hot-toast';

interface StockEntryActionsProps {
  entry: {
    id: string;
    status: string;
  };
}

export default function StockEntryActions({ entry }: StockEntryActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsLoading(true);
    try {
      const result = await cancelStockEntry(entry.id, cancelReason);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Stock entry cancelled and stock reverted');
        setShowModal(false);
        setCancelReason('');
      }
    } catch {
      toast.error('Failed to cancel stock entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
        title="Cancel Entry"
      >
        <XCircle className="w-4 h-4" />
      </button>

      {/* Cancel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Cancel Stock Entry</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-gray-600">
                This will revert all stock quantities back to their previous levels.
                This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Enter the reason..."
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
                disabled={isLoading}
              >
                Keep Entry
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="btn-danger"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Entry'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
