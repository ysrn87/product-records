import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getSale } from '@/actions/sales';
import { getCompanyProfile } from '@/actions/settings';
import { formatCurrency, formatDate } from '@/lib/utils';
import PrintButton from './PrintButton';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const [sale, company] = await Promise.all([
    getSale(id),
    getCompanyProfile(),
  ]);

  if (!sale) {
    notFound();
  }

  // SALES role can only view their own sales
  if (session.user.role === 'SALES' && sale.salespersonId !== session.user.id) {
    redirect('/dashboard/sales');
  }

  return (
    <div className="space-y-6">
      {/* Header - Hidden when printing */}
      <div className="flex items-center justify-between mb-8 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
          <p className="text-gray-500">#{sale.invoiceNumber}</p>
        </div>
        <PrintButton />
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 print:shadow-none print:border-none">
        {/* Company Header */}
        <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {company?.name || 'Company Name'}
            </h2>
            {company?.address && (
              <p className="text-gray-600 mt-1">{company.address}</p>
            )}
            {company?.phone && (
              <p className="text-gray-600">{company.phone}</p>
            )}
            {company?.email && (
              <p className="text-gray-600">{company.email}</p>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-primary-600">INVOICE</h1>
            <p className="text-gray-600 mt-2">
              <span className="font-medium">Invoice #:</span> {sale.invoiceNumber}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Date:</span> {formatDate(sale.date)}
            </p>
            {sale.status === 'CANCELLED' && (
              <p className="text-red-600 font-bold mt-2">CANCELLED</p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Bill To
          </h3>
          <p className="font-medium text-gray-900">{sale.customer.name}</p>
          {sale.customer.phone && (
            <p className="text-gray-600">{sale.customer.phone}</p>
          )}
          {sale.customer.address && (
            <p className="text-gray-600">{sale.customer.address}</p>
          )}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 text-left text-sm font-semibold text-gray-600">
                Item
              </th>
              <th className="py-3 text-right text-sm font-semibold text-gray-600">
                Unit Price
              </th>
              <th className="py-3 text-right text-sm font-semibold text-gray-600">
                Qty
              </th>
              <th className="py-3 text-right text-sm font-semibold text-gray-600">
                Disc
              </th>
              <th className="py-3 text-right text-sm font-semibold text-gray-600">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item: any, index: any) => {
              const variantName = item.variant.variantValues
                .map((vv: any) => vv.variantOption.value)
                .join(' - ');
              const subtotal = Number(item.unitPrice) * item.quantity;
              const discount = subtotal * (Number(item.discountPercent) / 100);
              const total = subtotal - discount;

              return (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-medium text-gray-900">
                      {item.variant.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {variantName}
                    </p>
                  </td>
                  <td className="py-4 text-right text-gray-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-4 text-right text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-4 text-right text-gray-600">
                    {Number(item.discountPercent) > 0 ? `${item.discountPercent}%` : '-'}
                  </td>
                  <td className="py-4 text-right font-medium text-gray-900">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(Number(sale.totalAmount) + Number(sale.discountAmount))}
              </span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div className="flex justify-between py-2 text-green-600">
                <span>Additional Discount</span>
                <span className="font-medium">
                  -{formatCurrency(Number(sale.discountAmount))}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-gray-900">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(Number(sale.totalAmount))}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Notes
            </h3>
            <p className="text-gray-600">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          {company?.name && <p className="mt-1">{company.name}</p>}
        </div>
      </div>
    </div>
  );
}
