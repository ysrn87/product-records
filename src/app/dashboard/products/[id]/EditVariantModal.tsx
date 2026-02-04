'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, X, Loader2, Save } from 'lucide-react';
import { updateVariant } from '@/actions/products';
import toast from 'react-hot-toast';

interface Variant {
  id: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  currentStock: number;
  isActive: boolean;
  variantValues: {
    variantOption: {
      value: string;
    };
  }[];
}

interface EditVariantModalProps {
  variant: Variant;
}

export default function EditVariantModal({ variant }: EditVariantModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: variant.sku,
    costPrice: String(variant.costPrice),
    sellingPrice: String(variant.sellingPrice),
    minStockLevel: String(variant.minStockLevel),
  });

  const variantName = variant.variantValues
    .map((vv) => vv.variantOption.value)
    .join(' / ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await updateVariant(variant.id, {
      sku: formData.sku,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      minStockLevel: parseInt(formData.minStockLevel),
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Variant updated successfully');
      setIsOpen(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  const profitMargin = formData.costPrice && formData.sellingPrice
    ? ((parseFloat(formData.sellingPrice) - parseFloat(formData.costPrice)) / parseFloat(formData.sellingPrice) * 100)
    : 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        title="Edit variant"
      >
        <Edit className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Variant</h3>
                {variantName && (
                  <p className="text-sm text-gray-500">{variantName}</p>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                  placeholder="e.g. PROD-001-RED-L"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    required
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    required
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              {/* Min Stock Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock Level <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  required
                  min="0"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current stock: <span className="font-medium">{variant.currentStock}</span>
                </p>
              </div>

              {/* Profit Margin Preview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Profit Margin:{' '}
                  <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitMargin.toFixed(1)}%
                  </span>
                  {' '}
                  <span className="text-gray-500">
                    (Rp {(parseFloat(formData.sellingPrice || '0') - parseFloat(formData.costPrice || '0')).toLocaleString('id-ID')} per unit)
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}