'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { updateProduct, toggleProductStatus } from '@/actions/products';
import toast from 'react-hot-toast';

interface ProductEditFormProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string;
    imageUrl: string | null;
    isActive: boolean;
  };
  categories: {
    id: string;
    name: string;
  }[];
}

export default function ProductEditForm({ product, categories }: ProductEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateProduct(product.id, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Product updated successfully');
      router.push(`/dashboard/products/${product.id}`);
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    const result = await toggleProductStatus(product.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
      router.refresh();
    }
    setIsToggling(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2 card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={product.name}
                required
                placeholder="Enter product name"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select id="categoryId" name="categoryId" defaultValue={product.categoryId} required>
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
                defaultValue={product.description || ''}
                placeholder="Enter product description"
              />
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
                defaultValue={product.imageUrl || ''}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link href={`/dashboard/products/`} className="btn-secondary">
                Cancel
              </Link>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Status Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Product Status</h2>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {product.isActive ? 'Active' : 'Inactive'}
                </p>
                <p className="text-sm text-gray-500">
                  {product.isActive
                    ? 'Product is visible and can be sold'
                    : 'Product is hidden from sales'}
                </p>
              </div>
              <button
                onClick={handleToggleStatus}
                disabled={isToggling}
                className={product.isActive ? 'btn-danger' : 'btn-success'}
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : product.isActive ? (
                  'Deactivate'
                ) : (
                  'Activate'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}