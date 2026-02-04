'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import { createProduct, createCategory, getCategories } from '@/actions/products';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

interface Category {
  id: string;
  name: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createProduct(formData);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success('Product created successfully');
      onClose();
      router.push(`/dashboard/products/${result.product?.id}`);
      router.refresh();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    const formData = new FormData();
    formData.set('name', newCategoryName);
    formData.set('description', newCategoryDesc);

    const result = await createCategory(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Category created');
      setNewCategoryName('');
      setNewCategoryDesc('');
      setShowNewCategory(false);
      loadCategories();
    }
  };

  const handleClose = () => {
    setShowNewCategory(false);
    setNewCategoryName('');
    setNewCategoryDesc('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Product"
      description="Add a new product to your catalog"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Enter product name"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Enter product description"
          />
        </div>

        {/* Category */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowNewCategory(!showNewCategory)}
              className="text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              {showNewCategory ? (
                <>
                  <X className="w-4 h-4" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> New Category
                </>
              )}
            </button>
          </div>

          {showNewCategory ? (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
              />
              <input
                type="text"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="Description (optional)"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="btn-primary"
              >
                Create Category
              </button>
            </div>
          ) : (
            <select id="categoryId" name="categoryId" required>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            placeholder="https://example.com/image.jpg"
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Enter a URL for the product image
          </p>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            After creating the product, you'll be able to add variant types and create variants with specific prices.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
