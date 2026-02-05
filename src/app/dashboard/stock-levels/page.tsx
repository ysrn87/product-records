import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Package, AlertTriangle, Search, Download } from 'lucide-react';
import Link from 'next/link';

export default async function StockLevelsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'WAREHOUSE'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const search = params.search?.toLowerCase();
  const filter = params.filter;
  const isWarehouse = session.user.role === 'WAREHOUSE';

  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      ...(filter === 'low' ? {
        currentStock: {
          lte: prisma.productVariant.fields.minStockLevel,
        },
      } : {}),
      ...(filter === 'out' ? {
        currentStock: { equals: 0 },
      } : {}),
      ...(search ? {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      variantValues: {
        include: {
          variantOption: {
            include: {
              variantType: true,
            },
          },
        },
      },
    },
    orderBy: [
      { currentStock: 'asc' },
      { product: { name: 'asc' } },
    ],
  });

  // Calculate statistics
  const stats = {
    totalVariants: variants.length,
    lowStock: variants.filter((v: any) => v.currentStock > 0 && v.currentStock <= v.minStockLevel).length,
    outOfStock: variants.filter((v: any) => v.currentStock === 0).length,
    totalValue: variants.reduce((sum: any, v: any) => sum + (v.currentStock * Number(v.costPrice)), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
          <p className="text-gray-500 mt-1">Monitor inventory across all products</p>
        </div>
        {session.user.role !== 'SALES' && (
          <Link href="/dashboard/stock-in" className="btn-primary">
            <Package className="w-5 h-5" />
            Manage Stock
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-2 ${isWarehouse ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
        <div className="stat-card">
          <p className="stat-label">Total Variants</p>
          <p className="stat-value">{formatNumber(stats.totalVariants)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Low Stock</p>
          <p className="stat-value text-yellow-600">{formatNumber(stats.lowStock)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Out of Stock</p>
          <p className="stat-value text-red-600">{formatNumber(stats.outOfStock)}</p>
        </div>
        {!isWarehouse && (
          <div className="stat-card">
            <p className="stat-label">Inventory Value</p>
            <p className="stat-value text-lg">{formatCurrency(stats.totalValue)}</p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <form className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by product or SKU..."
                  defaultValue={params.search}
                  className="w-full h-11 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm placeholder:text-gray-500"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="sm:w-44">
              <select
                name="filter"
                defaultValue={params.filter || ''}
                className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">All Products</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="btn-primary h-11 px-8 whitespace-nowrap text-sm font-medium"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product / Variant</th>
                <th>SKU</th>
                <th>Category</th>
                {!isWarehouse && <th className="text-right">Cost Price</th>}
                {!isWarehouse && <th className="text-right">Selling Price</th>}
                <th className="text-right">Stock</th>
                <th className="text-right">Min Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={isWarehouse ? 6 : 8} className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                variants.map((variant: any) => {
                  const variantName = variant.variantValues
                    .map((vv: any) => vv.variantOption.value)
                    .join(' - ');

                  const isLowStock = variant.currentStock > 0 && variant.currentStock <= variant.minStockLevel;
                  const isOutOfStock = variant.currentStock === 0;

                  return (
                    <tr key={variant.id} className={isOutOfStock ? 'bg-red-50' : isLowStock ? 'bg-yellow-50' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOutOfStock ? 'bg-red-100' : isLowStock ? 'bg-yellow-100' : 'bg-gray-100'
                            }`}>
                            {isOutOfStock || isLowStock ? (
                              <AlertTriangle className={`w-5 h-5 ${isOutOfStock ? 'text-red-500' : 'text-yellow-500'}`} />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{variant.product.name}</p>
                            <p className="text-sm text-gray-500">{variantName}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                          {variant.sku}
                        </code>
                      </td>
                      <td>
                        <span className="badge-gray">{variant.product.category.name}</span>
                      </td>
                      {!isWarehouse && (
                        <td className="text-right">
                          <p className="text-gray-600">{formatCurrency(variant.costPrice)}</p>
                        </td>
                      )}
                      {!isWarehouse && (
                        <td className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(variant.sellingPrice)}</p>
                        </td>
                      )}
                      <td className="text-right">
                        <p className={`font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                          {formatNumber(variant.currentStock)}
                        </p>
                      </td>
                      <td className="text-right">
                        <p className="text-gray-500">{formatNumber(variant.minStockLevel)}</p>
                      </td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge-danger">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge-success">In Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}