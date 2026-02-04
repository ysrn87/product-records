import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getProducts, getCategories } from '@/actions/products';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Package, Search, Eye, Edit } from 'lucide-react';
import ProductActions from './ProductActions';
import { serializeData } from '@/lib/utils';
import CategoryManager from './CategoryManager';
import Pagination from '@/components/ui/Pagination';
import AddProductButton from './AddProductButton';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;

  const { products, pagination } = await getProducts({ search: params.search, page: currentPage });
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <CategoryManager categories={serializeData(categories)} />
          <AddProductButton/>
        </div>
      </div>

      {/* Search */}
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
                  placeholder="Search product . . ."
                  defaultValue={params.search}
                  className="w-full h-11 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm placeholder:text-gray-500"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
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

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Variants</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No products found</p>
                    <Link
                      href="/dashboard/products/new"
                      className="text-primary-600 hover:underline mt-2 inline-block"
                    >
                      Add your first product
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((product: any) => {
                  const totalStock = product.variants.reduce((sum: any, v: any) => sum + v.currentStock, 0);
                  const activeVariants = product.variants.filter((v: any) => v.isActive).length;
                  const priceRange = product.variants.length > 0
                    ? {
                      min: Math.min(...product.variants.map((v: any) => Number(v.sellingPrice))),
                      max: Math.max(...product.variants.map((v: any) => Number(v.sellingPrice))),
                    }
                    : null;

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {priceRange && (
                              <p className="text-sm text-gray-500">
                                {priceRange.min === priceRange.max
                                  ? formatCurrency(priceRange.min)
                                  : `${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-gray">{product.category.name}</span>
                      </td>
                      <td>
                        <p className="text-gray-900">{activeVariants} active</p>
                        <p className="text-sm text-gray-500">{product.variants.length} total</p>
                      </td>
                      <td>
                        <p className="text-gray-900">{totalStock} units</p>
                      </td>
                      <td>
                        {product.isActive ? (
                          <span className="badge-success">Active</span>
                        ) : (
                          <span className="badge-gray">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/products/${product.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Link>
                          <Link
                            href={`/dashboard/products/${product.id}/edit`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </Link>
                          <ProductActions product={product} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
        />
      </div>
    </div>
  );
}