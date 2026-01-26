'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { addVariantType } from '@/actions/products';
import toast from 'react-hot-toast';

interface AddVariantTypeFormProps {
  productId: string;
}

export default function AddVariantTypeForm({ productId }: AddVariantTypeFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [options, setOptions] = useState<string[]>(['']);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredOptions = options.filter(o => o.trim() !== '');
    if (!typeName.trim() || filteredOptions.length === 0) {
      toast.error('Please enter type name and at least one option');
      return;
    }

    setIsLoading(true);
    const result = await addVariantType(productId, typeName.trim(), filteredOptions);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Variant type added successfully');
      setTypeName('');
      setOptions(['']);
      setIsOpen(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="btn-primary text-sm">
        <Plus className="w-4 h-4" />
        Add Variant Type
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Variant Type</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="e.g. Size, Color, Flavor"
              required
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-2 text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Type'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}