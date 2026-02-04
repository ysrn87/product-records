'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createCustomer } from '@/actions/customers';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createCustomer(formData);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success('Customer created successfully');
      onClose();
      router.refresh();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Customer"
      description="Add a new customer to your database"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Enter customer name"
            autoFocus
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="Enter phone number"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter email address"
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            placeholder="Enter full address"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Customer'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
