'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Plus, Trash2, X, Loader2, Save } from 'lucide-react';
import {
  updateVariantType,
  addVariantOption,
  updateVariantOption,
  deleteVariantOption,
  deleteVariantType,
} from '@/actions/products';
import toast from 'react-hot-toast';

interface VariantType {
  id: string;
  name: string;
  options: { id: string; value: string }[];
}

interface EditVariantTypeModalProps {
  variantType: VariantType;
}

export default function EditVariantTypeModal({ variantType }: EditVariantTypeModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typeName, setTypeName] = useState(variantType.name);
  const [newOption, setNewOption] = useState('');
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpdateTypeName = async () => {
    if (typeName.trim() === variantType.name) return;
    
    setIsLoading(true);
    const result = await updateVariantType(variantType.id, typeName.trim());
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Variant type updated');
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleAddOption = async () => {
    if (!newOption.trim()) return;
    
    setIsLoading(true);
    const result = await addVariantOption(variantType.id, newOption.trim());
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Option added');
      setNewOption('');
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleUpdateOption = async (optionId: string) => {
    if (!editingOptionValue.trim()) return;
    
    setIsLoading(true);
    const result = await updateVariantOption(optionId, editingOptionValue.trim());
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Option updated');
      setEditingOptionId(null);
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleDeleteOption = async (optionId: string) => {
    setDeletingId(optionId);
    const result = await deleteVariantOption(optionId);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Option deleted');
      router.refresh();
    }
    setDeletingId(null);
  };

  const handleDeleteType = async () => {
    if (!confirm(`Delete variant type "${variantType.name}"? This cannot be undone.`)) return;
    
    setIsLoading(true);
    const result = await deleteVariantType(variantType.id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Variant type deleted');
      setIsOpen(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        title="Edit variant type"
      >
        <Edit className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Variant Type</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Type Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    placeholder="e.g. Size, Color"
                  />
                  <button
                    onClick={handleUpdateTypeName}
                    disabled={isLoading || typeName.trim() === variantType.name}
                    className="btn-primary px-3"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options ({variantType.options.length})
                </label>
                <div className="space-y-2">
                  {variantType.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      {editingOptionId === option.id ? (
                        <>
                          <input
                            type="text"
                            value={editingOptionValue}
                            onChange={(e) => setEditingOptionValue(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateOption(option.id)}
                            disabled={isLoading}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingOptionId(null)}
                            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg">
                            {option.value}
                          </span>
                          <button
                            onClick={() => {
                              setEditingOptionId(option.id);
                              setEditingOptionValue(option.value);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteOption(option.id)}
                            disabled={deletingId === option.id}
                            className="p-2 hover:bg-red-50 rounded-lg"
                          >
                            {deletingId === option.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Option */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                  />
                  <button
                    onClick={handleAddOption}
                    disabled={isLoading || !newOption.trim()}
                    className="btn-primary px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-between">
              <button
                onClick={handleDeleteType}
                disabled={isLoading}
                className="btn-danger text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Type
              </button>
              <button onClick={() => setIsOpen(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}