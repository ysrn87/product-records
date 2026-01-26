'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyProfile {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  invoicePrefix: string;
  stockEntryPrefix: string;
}

interface CompanyProfileFormProps {
  profile: CompanyProfile;
}

export default function CompanyProfileForm({ profile }: CompanyProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name,
    address: profile.address || '',
    phone: profile.phone || '',
    email: profile.email || '',
    invoicePrefix: profile.invoicePrefix,
    stockEntryPrefix: profile.stockEntryPrefix,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.id, ...formData }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      toast.success('Company profile updated');
    } catch {
      toast.error('Failed to update company profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          id="address"
          rows={2}
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="invoicePrefix" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Prefix
          </label>
          <input
            type="text"
            id="invoicePrefix"
            value={formData.invoicePrefix}
            onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
            maxLength={5}
          />
        </div>
        <div>
          <label htmlFor="stockEntryPrefix" className="block text-sm font-medium text-gray-700 mb-1">
            Stock Entry Prefix
          </label>
          <input
            type="text"
            id="stockEntryPrefix"
            value={formData.stockEntryPrefix}
            onChange={(e) => setFormData({ ...formData, stockEntryPrefix: e.target.value.toUpperCase() })}
            maxLength={5}
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
