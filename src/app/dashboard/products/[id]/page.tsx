import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getProduct } from '@/actions/products';
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Edit, Package, Plus, AlertTriangle } from 'lucide-react';
import VariantForm from './VariantForm';
import { serializeData } from '@/lib/utils';
import AddVariantTypeForm from './AddVariantTypeForm';
import VariantActions from './VariantActions';
import ProductDeleteButton from '../ProductDeleteButton';
import EditVariantTypeModal from './EditVariantTypeModal';
import EditVariantModal from './EditVariantModal';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const product = serializeData(await getProduct(id));

  if (!product) {
    notFound();
  }

  // Calculate stats
  const totalStock = product.variants.reduce((sum: any, v: any) => sum + v.currentStock, 0);
  const activeVariants = product.variants.filter((v: any) => v.isActive);
  const lowStockVariants = product.variants.filter(
    (v: any) => v.isActive && v.currentStock <= v.minStockLevel
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              {product.isActive ? (
                <span className="badge-success">Active</span>
              ) : (
                <span className="badge-gray">Inactive</span>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              <span className="badge-gray">{product.category.name}</span>
              {product.description && (
                <span className="ml-2">{product.description}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/products/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" />
            Edit Product
          </Link>
          <ProductDeleteButton productId={id} productName={product.name} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Variants</p>
          <p className="stat-value">{product.variants.length}</p>
          <p className="text-sm text-gray-500">{activeVariants.length} active</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Stock</p>
          <p className="stat-value">{formatNumber(totalStock)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Price Range</p>
          <p className="stat-value text-lg">
            {product.variants.length > 0
              ? `${formatCurrency(Math.min(...product.variants.map((v: any) => Number(v.sellingPrice))))} - ${formatCurrency(Math.max(...product.variants.map((v: any) => Number(v.sellingPrice))))}`
              : '-'}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Low Stock Alert</p>
          <p className={`stat-value ${lowStockVariants.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {lowStockVariants.length}
          </p>
          <p className="text-sm text-gray-500">variants need restock</p>
        </div>
      </div>

      {/* Variant Types */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Variant Types</h2>
          <AddVariantTypeForm productId={id} />
        </div>
        <div className="card-body">
          {product.variantTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No variant types defined. Add variant types like Size, Color, Flavor, etc.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {product.variantTypes.map((type: any) => (
                <div key={type.id} className="bg-gray-50 rounded-lg p-4 min-w-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{type.name}</p>
                    <EditVariantTypeModal variantType={type} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {type.options.map((option: any) => (
                      <span key={option.id} className="badge-gray text-xs">
                        {option.value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Variants */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Product Variants</h2>
          <VariantForm productId={id} variantTypes={product.variantTypes} />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Variant</th>
                <th className="text-right">Cost Price</th>
                <th className="text-right">Selling Price</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Min Level</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No variants created yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add variant types first, then create variants
                    </p>
                  </td>
                </tr>
              ) : (
                product.variants.map((variant: any) => {
                  const variantName = variant.variantValues
                    .map((vv: any) => vv.variantOption.value)
                    .join(' / ');
                  const isLowStock = variant.currentStock <= variant.minStockLevel;

                  return (
                    <tr key={variant.id} className={isLowStock ? 'bg-yellow-50' : ''}>
                      <td>
                        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                          {variant.sku}
                        </code>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {isLowStock && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="font-medium text-gray-900">
                            {variantName || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="text-gray-600">
                          {formatCurrency(variant.costPrice)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(variant.sellingPrice)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`font-bold ${variant.currentStock === 0 ? 'text-red-600' :
                          isLowStock ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                          {formatNumber(variant.currentStock)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="text-gray-500">
                          {formatNumber(variant.minStockLevel)}
                        </span>
                      </td>
                      <td>
                        {variant.isActive ? (
                          <span className="badge-success">Active</span>
                        ) : (
                          <span className="badge-gray">Inactive</span>
                        )}
                      </td>
                      {/* ADD THIS NEW TD HERE */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditVariantModal variant={variant} />
                          <VariantActions
                            variantId={variant.id}
                            sku={variant.sku}
                            isActive={variant.isActive}
                          />
                        </div>
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
