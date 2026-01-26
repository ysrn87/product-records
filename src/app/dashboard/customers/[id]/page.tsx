import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getCustomer, getCustomerStats } from '@/actions/customers';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, User, ShoppingBag, DollarSign, Calendar, Edit, Mail, Phone, MapPin } from 'lucide-react';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  const [customer, stats] = await Promise.all([
    getCustomer(id),
    getCustomerStats(id),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-500 mt-1">Customer details</p>
          </div>
        </div>
        <Link href={`/dashboard/customers/${id}/edit`} className="btn-primary">
          <Edit className="w-4 h-4" />
          Edit Customer
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">
                      {customer.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">
                      {customer.email || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">
                      {customer.address || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          {/* Recent Purchases */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Purchases</h2>
              <span className="text-sm text-gray-500">Last 10 transactions</span>
            </div>
            {customer.sales.length === 0 ? (
              <div className="card-body text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No purchases yet</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.sales.map((sale: any) => (
                      <tr key={sale.id}>
                        <td>
                          <Link
                            href={`/dashboard/sales/${sale.id}`}
                            className="font-mono text-sm text-primary-600 hover:underline"
                          >
                            {sale.invoiceNumber}
                          </Link>
                        </td>
                        <td>
                          <p className="text-gray-900">{sale.items.length} items</p>
                        </td>
                        <td>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(Number(sale.totalAmount))}
                          </p>
                        </td>
                        <td>
                          {sale.status === 'COMPLETED' && (
                            <span className="badge-success">Completed</span>
                          )}
                          {sale.status === 'CANCELLED' && (
                            <span className="badge-danger">Cancelled</span>
                          )}
                        </td>
                        <td>
                          <p className="text-sm text-gray-500">
                            {formatDate(sale.date)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Statistics</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.totalPurchases}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600">Total Spent</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Customer Since</span>
            </div>
            <p className="font-medium text-gray-900">
              {formatDate(customer.createdAt)}
            </p>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">Customer ID</p>
              <p className="font-mono text-xs text-gray-600">{customer.id}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="card-body space-y-2">
              <Link
                href={`/dashboard/sales/new?customerId=${customer.id}`}
                className="block w-full btn-primary text-center"
              >
                Create New Sale
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}