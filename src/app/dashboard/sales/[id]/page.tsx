import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getSale, cancelSale } from '@/actions/sales';
import { formatCurrency, formatDateTime, paymentMethodNames } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, FileText, XCircle, Package, User, CreditCard, Calendar } from 'lucide-react';
import SaleCancelButton from './SaleCancelButton';
import { serializeData } from '@/lib/utils';

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const sale = serializeData(await getSale(id));

  if (!sale) {
    notFound();
  }

  // SALES role can only view their own sales
  if (session.user.role === 'SALES' && sale.salespersonId !== session.user.id) {
    redirect('/dashboard/sales');
  }

  const canCancel = ['PRIVILEGE', 'ADMIN'].includes(session.user.role) && sale.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sales"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {sale.invoiceNumber}
            </h1>
            <p className="text-gray-500 mt-1">Sale details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/sales/${id}/invoice`} className="btn-outline">
            <FileText className="w-4 h-4" />
            View Invoice
          </Link>
          {canCancel && <SaleCancelButton saleId={id} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Items</h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Discount</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item: any) => {
                    const variantName = item.variant.variantValues
                      .map((vv: any) => vv.variantOption.value)
                      .join(' - ');
                    const subtotal = Number(item.unitPrice) * item.quantity;
                    const discount = subtotal * (Number(item.discountPercent) / 100);
                    const total = subtotal - discount;

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
                        <td className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">
                          {Number(item.discountPercent) > 0 ? (
                            <span className="text-green-600">
                              {item.discountPercent}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="text-right font-medium">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={4} className="text-right font-medium">
                      Subtotal
                    </td>
                    <td className="text-right font-medium">
                      {formatCurrency(Number(sale.totalAmount)+ Number(sale.discountAmount))}
                    </td>
                  </tr>
                  {Number(sale.discountAmount) > 0 && (
                    <tr>
                      <td colSpan={4} className="text-right font-medium text-green-600">
                        Additional Discount
                      </td>
                      <td className="text-right font-medium text-green-600">
                        -{formatCurrency(Number(sale.discountAmount))}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={4} className="text-right text-lg font-bold">
                      Total
                    </td>
                    <td className="text-right text-lg font-bold">
                      {formatCurrency(Number(sale.totalAmount))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-gray-900">Notes</h2>
              </div>
              <div className="card-body">
                <p className="text-gray-600 whitespace-pre-wrap">{sale.notes}</p>
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
                {sale.status === 'COMPLETED' && (
                  <span className="badge-success text-base px-4 py-2">
                    Completed
                  </span>
                )}
                {sale.status === 'CANCELLED' && (
                  <span className="badge-danger text-base px-4 py-2">
                    Cancelled
                  </span>
                )}
                {sale.status === 'VOIDED' && (
                  <span className="badge-warning text-base px-4 py-2">
                    Voided
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{sale.customer.name}</p>
              </div>
              {sale.customer.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{sale.customer.phone}</p>
                </div>
              )}
              {sale.customer.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{sale.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Payment</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium text-gray-900">
                  {paymentMethodNames[sale.paymentMethod]}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(Number(sale.totalAmount))}
                </p>
              </div>
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
                <p className="text-sm text-gray-500">Sale Date</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(sale.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Salesperson</p>
                <p className="font-medium text-gray-900">{sale.salesperson.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(sale.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
