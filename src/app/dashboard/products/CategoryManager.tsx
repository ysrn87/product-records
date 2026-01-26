'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, X, FolderOpen } from 'lucide-react';
import { createCategory, deleteCategory } from '@/actions/products';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: { products: number };
}

interface CategoryManagerProps {
  categories: Category[];
}

export default function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const result = await createCategory(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Category created successfully');
      setShowCreateForm(false);
      router.refresh();
    }
    setIsCreating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;

    setDeletingId(id);
    const result = await deleteCategory(id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Category deleted successfully');
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-outline text-sm">
        <FolderOpen className="w-4 h-4" />
        Manage Categories
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Manage Categories</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Category List */}
              <div className="space-y-2 mb-4">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No categories yet</p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-gray-500">{category.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={deletingId === category.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Delete category"
                      >
                        {deletingId === category.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Create Form */}
              {showCreateForm ? (
                <form onSubmit={handleCreate} className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Category name"
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="description"
                      placeholder="Description (optional)"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="submit" disabled={isCreating} className="btn-primary text-sm py-1.5">
                      {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary text-sm py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full btn-outline text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              )}
            </div>

            <div className="p-4 border-t">
              <button onClick={() => setIsOpen(false)} className="w-full btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}