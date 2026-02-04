'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Trash2, Search, User, Package } from 'lucide-react';
import { createSale, getAvailableVariants } from '@/actions/sales';
import { searchCustomers } from '@/actions/customers';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { PaymentMethod } from '@prisma/client'; 

interface Variant {
  id: string;
  sku: string;
  sellingPrice: any;
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

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

interface CartItem {
  variantId: string;
  variant: Variant;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  
  // Product state
  const [productSearch, setProductSearch] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Load variants
  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async (search?: string) => {
    const data = await getAvailableVariants(search);
    setVariants(data);
  };

  // Search customers
  const handleCustomerSearch = useCallback(async (query: string) => {
    setCustomerSearch(query);
    if (query.length >= 2) {
      const results = await searchCustomers(query);
      setCustomers(results);
    } else {
      setCustomers([]);
    }
  }, []);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setCustomers([]);
    setIsNewCustomer(false);
  };

  const handleNewCustomer = () => {
    setIsNewCustomer(true);
    setSelectedCustomer(null);
    setCustomers([]);
    setCustomerSearch('');
  };

  // Add to cart
  const addToCart = (variant: Variant) => {
    const existing = cart.find((item) => item.variantId === variant.id);
    if (existing) {
      if (existing.quantity >= variant.currentStock) {
        toast.error('Not enough stock');
        return;
      }
      setCart(
        cart.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          variantId: variant.id,
          variant,
          quantity: 1,
          unitPrice: Number(variant.sellingPrice),
          discountPercent: 0,
        },
      ]);
    }
    setShowProductSearch(false);
    setProductSearch('');
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    const item = cart.find((i) => i.variantId === variantId);
    if (!item) return;

    if (quantity < 1) {
      removeFromCart(variantId);
      return;
    }

    if (quantity > item.variant.currentStock) {
      toast.error('Not enough stock');
      return;
    }

    setCart(
      cart.map((i) =>
        i.variantId === variantId ? { ...i, quantity } : i
      )
    );
  };

  const updateDiscount = (variantId: string, discountPercent: number) => {
    setCart(
      cart.map((i) =>
        i.variantId === variantId
          ? { ...i, discountPercent: Math.min(100, Math.max(0, discountPercent)) }
          : i
      )
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart(cart.filter((i) => i.variantId !== variantId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const itemDiscount = (item.unitPrice * item.quantity * item.discountPercent) / 100;
    return sum + item.unitPrice * item.quantity - itemDiscount;
  }, 0);

  const total = Math.max(0, subtotal - discountAmount);

  // Submit sale
  const handleSubmit = async () => {
    if (!selectedCustomer && !isNewCustomer) {
      toast.error('Please select or add a customer');
      return;
    }

    if (isNewCustomer && !newCustomer.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsLoading(true);

    const saleData = {
      customerId: selectedCustomer?.id,
      customerName: isNewCustomer ? newCustomer.name : selectedCustomer!.name,
      customerPhone: isNewCustomer ? newCustomer.phone : selectedCustomer?.phone || undefined,
      customerAddress: isNewCustomer ? newCustomer.address : selectedCustomer?.address || undefined,
      paymentMethod,
      discountAmount,
      notes,
      items: cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      })),
    };

    const result = await createSale(saleData);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success('Sale created successfully!');
      router.push(`/dashboard/sales/${result.sale?.id}/invoice`);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/sales"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
          <p className="text-gray-500 mt-1">Create a new sales transaction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          {/* Customer Selection */}
          <div className="card" style={{ overflow: 'visible' }}>
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Customer</h2>
              {!isNewCustomer && !selectedCustomer && (
                <button
                  type="button"
                  onClick={handleNewCustomer}
                  className="text-sm text-primary-600 hover:underline"
                >
                  + New Customer
                </button>
              )}
            </div>
            <div className="card-body" style={{ overflow: 'visible' }}>
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-500">{selectedCustomer.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : isNewCustomer ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">New Customer</p>
                    <button
                      type="button"
                      onClick={() => setIsNewCustomer(false)}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Customer name *"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search customer by name or phone..."
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    className="pl-10 w-full"
                  />
                  {customers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                              <p className="text-sm text-gray-500 truncate">{customer.phone || 'No phone'}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {customerSearch.length >= 2 && customers.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <p className="text-gray-500 text-center mb-3">No customers found</p>
                      <button
                        type="button"
                        onClick={handleNewCustomer}
                        className="w-full btn-primary text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Customer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Products */}
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
                          onClick={() => addToCart(variant)}
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
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(variant.sellingPrice)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Stock: {variant.currentStock}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No items added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.variantId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.variant.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getVariantName(item.variant)} • {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.variantId)}
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
                            max={item.variant.currentStock}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.variantId, parseInt(e.target.value) || parseInt(e.target.value))
                            }
                            className="w-full sm:w-24 text-center"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-sm text-gray-600 whitespace-nowrap">Disc %:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) =>
                              updateDiscount(item.variantId, parseFloat(e.target.value) || 0)
                            }
                            className="w-full sm:w-24 text-center"
                          />
                        </div>
                        <div className="sm:ml-auto text-left sm:text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(
                              item.unitPrice * item.quantity * (1 - item.discountPercent / 100)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Payment & Summary */}
          <div className="card sticky top-6">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Order Summary</h2>
            </div>
            <div className="card-body space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="EWALLET">E-Wallet</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Additional Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Discount
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || cart.length === 0}
                className="w-full btn-success py-3 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Complete Sale • ${formatCurrency(total)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}