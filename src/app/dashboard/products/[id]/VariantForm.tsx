'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVariant } from '@/actions/products';
import { Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface VariantFormProps {
  productId: string;
  variantTypes: {
    id: string;
    name: string;
    options: { id: string; value: string }[];
  }[];
}

export default function VariantForm({ productId, variantTypes }: VariantFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [sku, setSku] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('10');

  const resetForm = () => {
    setSelectedOptions({});
    setSku('');
    setCostPrice('');
    setSellingPrice('');
    setMinStockLevel('10');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const optionIds = Object.values(selectedOptions).filter(Boolean);

    if (variantTypes.length > 0 && optionIds.length !== variantTypes.length) {
      toast.error('Please select all variant options');
      setIsLoading(false);
      return;
    }

    const result = await createVariant({
      productId,
      sku,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      minStockLevel: parseInt(minStockLevel) || 0,
      variantOptions: optionIds,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Variant created successfully');
      router.refresh();
      resetForm();
      setIsOpen(false);
    }
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="btn-primary text-sm">
        <Plus className="w-4 h-4" />
        Add Variant
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add New Variant</h3>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Variant Options */}
          {variantTypes.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Variant Options</p>
              {variantTypes.map((type) => (
                <div key={type.id}>
                  <label className="block text-sm text-gray-600 mb-1">
                    {type.name} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedOptions[type.id] || ''}
                    onChange={(e) => setSelectedOptions({ ...selectedOptions, [type.id]: e.target.value })}
                    required
                  >
                    <option value="">Select {type.name}</option>
                    {type.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              placeholder="e.g. PROD-001-RED-L"
            />
            <p className="text-xs text-gray-500 mt-1">Unique identifier for this variant</p>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
                min="0"
                step="100"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                min="0"
                step="100"
                placeholder="0"
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
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
              required
              min="0"
              step="1"
              placeholder="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert will show when stock falls below this level
            </p>
          </div>

          {/* Profit Margin Preview */}
          {costPrice && sellingPrice && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Profit Margin:{' '}
                <span className="font-semibold text-green-600">
                  {((parseFloat(sellingPrice) - parseFloat(costPrice)) / parseFloat(sellingPrice) * 100).toFixed(1)}%
                </span>
                {' '}
                <span className="text-gray-500">
                  (Rp {(parseFloat(sellingPrice) - parseFloat(costPrice)).toLocaleString('id-ID')} per unit)
                </span>
              </p>
            </div>
          )}

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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Variant
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}