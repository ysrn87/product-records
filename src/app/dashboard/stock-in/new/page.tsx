'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Trash2, Search, Package } from 'lucide-react';
import { createStockEntry, getVariantsForStockEntry } from '@/actions/stock';
import { formatCurrency, formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Variant {
  id: string;
  sku: string;
  costPrice: any;
  currentStock: number;
  product: {
    name: string;
  };
  variantValues: {
    variantOption: {
      value: string;
      variantType: {
        name: string;
      };
    };
  }[];
}

interface StockItem {
  variantId: string;
  variant: Variant;
  quantity: number;
  costPrice: number;
}

export default function NewStockEntryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user is warehouse role
  const isWarehouse = session?.user?.role === 'WAREHOUSE';
  
  // Product state
  const [productSearch, setProductSearch] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  // Entry items
  const [items, setItems] = useState<StockItem[]>([]);
  const [notes, setNotes] = useState('');

  // Load variants
  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async (search?: string) => {
    const data = await getVariantsForStockEntry(search);
    setVariants(data);
  };

  // Add item
  const addItem = (variant: Variant) => {
    const existing = items.find((item) => item.variantId === variant.id);
    if (existing) {
      setItems(
        items.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          variantId: variant.id,
          variant,
          quantity: 1,
          costPrice: Number(variant.costPrice),
        },
      ]);
    }
    setShowProductSearch(false);
    setProductSearch('');
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(variantId);
      return;
    }

    setItems(
      items.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const updateCostPrice = (variantId: string, costPrice: number) => {
    setItems(
      items.map((item) =>
        item.variantId === variantId ? { ...item, costPrice: Math.max(0, costPrice) } : item
      )
    );
  };

  const removeItem = (variantId: string) => {
    setItems(items.filter((item) => item.variantId !== variantId));
  };

  const getVariantName = (variant: Variant) => {
    const options = variant.variantValues
      .map((vv) => vv.variantOption.value)
      .join(' - ');
    return options || variant.sku;
  };

  const filteredVariants = variants.filter((v) => {
    if (!productSearch) return true;
    const searchLower = productSearch.toLowerCase();
    return (
      v.sku.toLowerCase().includes(searchLower) ||
      v.product.name.toLowerCase().includes(searchLower) ||
      getVariantName(v).toLowerCase().includes(searchLower)
    );
  });

  // Calculate totals
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

  // Submit
  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsLoading(true);

    const result = await createStockEntry({
      notes,
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        costPrice: item.costPrice,
      })),
    });

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success('Stock entry recorded successfully!');
      router.push('/dashboard/stock-in');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/stock-in"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Stock Entry</h1>
          <p className="text-gray-500 mt-1">Record incoming product stock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Products */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Products</h2>
              <button
                type="button"
                onClick={() => setShowProductSearch(!showProductSearch)}
                className="btn-primary text-sm py-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
            <div className="card-body">
              {/* Product Search */}
              {showProductSearch && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by product name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <div className="mt-2 max-h-60 overflow-auto border border-gray-200 rounded-lg">
                    {filteredVariants.length === 0 ? (
                      <p className="p-4 text-center text-gray-500">No products found</p>
                    ) : (
                      filteredVariants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => addItem(variant)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{variant.product.name}</p>
                              <p className="text-sm text-gray-500">
                                {getVariantName(variant)} • {variant.sku}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {!isWarehouse && (
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(variant.costPrice)}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              Stock: {formatNumber(variant.currentStock)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Items List */}
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No items added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.variantId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.variant.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getVariantName(item.variant)} • Current stock: {formatNumber(item.variant.currentStock)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-sm text-gray-600 whitespace-nowrap">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.variantId, parseInt(e.target.value) || 1)
                            }
                            className="w-full sm:w-24 text-center"
                          />
                        </div>
                        {!isWarehouse && (
                          <div className="flex items-center gap-2 flex-1">
                            <label className="text-sm text-gray-600 whitespace-nowrap">Cost:</label>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={item.costPrice}
                              onChange={(e) =>
                                updateCostPrice(item.variantId, parseFloat(e.target.value) || 0)
                              }
                              className="w-full sm:w-36"
                            />
                          </div>
                        )}
                        {!isWarehouse && (
                          <div className="sm:ml-auto text-left sm:text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(item.quantity * item.costPrice)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div>
          <div className="card sticky top-6">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Entry Summary</h2>
            </div>
            <div className="card-body space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Supplier, batch number, etc..."
                />
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Total Items</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Quantity</span>
                  <span>{formatNumber(totalQuantity)} units</span>
                </div>
                {!isWarehouse && (
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Cost</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || items.length === 0}
                className="w-full btn-success py-3 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  `Record Stock Entry`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}