import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSales } from '@/actions/sales';
import { formatCurrency, formatDateTime, paymentMethodNames } from '@/lib/utils';
import Link from 'next/link';
import { Plus, ShoppingCart, Search, Eye, FileText } from 'lucide-react';

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;

  // For SALES role, only show their own sales
  const filters: { search?: string; status?: string; salespersonId?: string } = {
    search: params.search,
    status: params.status,
  };

  if (session.user.role === 'SALES') {
    filters.salespersonId = session.user.id;
  }

  const sales = await getSales(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500 mt-1">
            {session.user.role === 'SALES' ? 'Your sales transactions' : 'All sales transactions'}
          </p>
        </div>
        <Link href="/dashboard/sales/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          New Sale
        </Link>
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
                  placeholder="Search by invoice or customer..."
                  defaultValue={params.search}
                  className="w-full h-11 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm placeholder:text-gray-500"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-44">
              <select
                name="status"
                defaultValue={params.status || ''}
                className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="VOIDED">Voided</option>
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

      {/* Sales Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No sales found</p>
                    <Link
                      href="/dashboard/sales/new"
                      className="text-primary-600 hover:underline mt-2 inline-block"
                    >
                      Create your first sale
                    </Link>
                  </td>
                </tr>
              ) : (
                sales.map((sale: any) => (
                  <tr key={sale.id}>
                    <td>
                      <p className="font-mono text-sm font-medium text-gray-900">
                        {sale.invoiceNumber}
                      </p>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">{sale.customer.name}</p>
                      {sale.customer.phone && (
                        <p className="text-sm text-gray-500">{sale.customer.phone}</p>
                      )}
                    </td>
                    <td>
                      <p className="text-gray-900">{sale.items?.length || 0} items</p>
                      <p className="text-sm text-gray-500">
                        {sale.items?.reduce((sum: any, item: any) => sum + item.quantity, 0) || 0} units
                      </p>
                    </td>
                    <td>
                      <span className="badge-gray">
                        {paymentMethodNames[sale.paymentMethod]}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(Number(sale.totalAmount))}
                      </p>
                      {Number(sale.discountAmount) > 0 && (
                        <p className="text-xs text-green-600">
                          -{formatCurrency(Number(sale.discountAmount))} disc
                        </p>
                      )}
                    </td>
                    <td>
                      {sale.status === 'COMPLETED' && (
                        <span className="badge-success">Completed</span>
                      )}
                      {sale.status === 'CANCELLED' && (
                        <span className="badge-danger">Cancelled</span>
                      )}
                      {sale.status === 'VOIDED' && (
                        <span className="badge-warning">Voided</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(sale.date)}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/sales/${sale.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Link>
                        <Link
                          href={`/dashboard/sales/${sale.id}/invoice`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Invoice"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}