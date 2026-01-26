import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getStockEntry } from '@/actions/stock';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Package, User, Calendar, Truck } from 'lucide-react';
import StockEntryCancelButton from './StockEntryCancelButton';

export default async function StockEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'WAREHOUSE'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const entry = await getStockEntry(id);
  const isWarehouse = session.user.role === 'WAREHOUSE';

  if (!entry) {
    notFound();
  }

  // Add this near the top of the component, after getting `entry`
  const totalCost = entry.items.reduce(
    (sum, item) => sum + Number(item.costPrice) * item.quantity,
    0
  );

  const canCancel = ['PRIVILEGE', 'ADMIN'].includes(session.user.role) && entry.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/stock-in"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {entry.entryNumber}
            </h1>
            <p className="text-gray-500 mt-1">Stock entry details</p>
          </div>
        </div>
        {canCancel && <StockEntryCancelButton entryId={id} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Entry Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Items</h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    {!isWarehouse && <th className="text-right">Purchase Price</th>}
                    <th className="text-right">Quantity</th>
                    {!isWarehouse && <th className="text-right">Total Cost</th>}
                  </tr>
                </thead>
                <tbody>
                  {entry.items.map((item: any) => {
                    const variantName = item.variant.variantValues
                      .map((vv: any) => vv.variantOption.value)
                      .join(' - ');
                    const totalCost = Number(item.purchasePrice) * item.quantity;

                    return (
                      <tr key={item.id}>
                        <td>
                          <p className="font-medium text-gray-900">
                            {item.variant.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {variantName} • {item.variant.sku}
                          </p>
                        </td>
                        {!isWarehouse && (
                          <td className="text-right">
                            {formatCurrency(item.purchasePrice)}
                          </td>
                        )}
                        <td className="text-right">{item.quantity}</td>
                        {!isWarehouse && (
                          <td className="text-right font-medium">
                            {formatCurrency(totalCost)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                {!isWarehouse && (
                  <tfoot>
                    <tr className="border-t-2">
                      <td colSpan={3} className="text-right font-bold">
                        Total Cost
                      </td>
                      <td className="text-right font-bold text-lg">
                        {formatCurrency(totalCost)} 
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-gray-900">Notes</h2>
              </div>
              <div className="card-body">
                <p className="text-gray-600 whitespace-pre-wrap">{entry.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <div className="card-body">
              <div className="text-center">
                {entry.status === 'COMPLETED' && (
                  <span className="badge-success text-base px-4 py-2">
                    Completed
                  </span>
                )}
                {entry.status === 'CANCELLED' && (
                  <span className="badge-danger text-base px-4 py-2">
                    Cancelled
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Supplier</h2>
            </div>
            <div className="card-body">
              <p className="font-medium text-gray-900">
                {entry.notes || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Summary</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="font-medium text-gray-900">{entry.items.length} items</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Units</p>
                <p className="font-medium text-gray-900">
                  {entry.items.reduce((sum: any, item: any) => sum + item.quantity, 0)} units
                </p>
              </div>
              {!isWarehouse && (
                <div>
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(totalCost)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Date Info */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Timeline</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-sm text-gray-500">Entry Date</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(entry.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium text-gray-900">{entry.recordedBy.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}