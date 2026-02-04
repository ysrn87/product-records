import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCustomers } from '@/actions/customers';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { Users, Search, Eye, Edit, ShoppingCart } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import AddCustomerButton from './AddCustomerButton';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;

  const { customers, pagination } = await getCustomers({ search: params.search, page: currentPage });
  const isSalesRole = session.user.role === 'SALES';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSalesRole ? 'My Customers' : 'Customers'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isSalesRole
              ? 'Customers you have sold to'
              : 'Manage your customer database'
            }
          </p>
        </div>
        <AddCustomerButton />
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
                  placeholder="Search by name, phone, or email..."
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

      {/* Customers Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>{isSalesRole ? 'My Orders' : 'Total Orders'}</th>
                <th>{isSalesRole ? 'My Sales' : 'Total Spent'}</th>
                <th>Last Order</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {isSalesRole
                        ? 'No customers yet. Make your first sale!'
                        : 'No customers found'
                      }
                    </p>
                    {!isSalesRole && (
                      <Link
                        href="/dashboard/customers/new"
                        className="text-primary-600 hover:underline mt-2 inline-block"
                      >
                        Add your first customer
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                customers.map((customer: any) => {
                  const completedSales = customer.sales.filter((s: any) => s.status === 'COMPLETED');
                  const totalSpent = completedSales.reduce(
                    (sum: any, s: any) => sum + Number(s.totalAmount),
                    0
                  );
                  const lastOrder = completedSales[0];

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            {customer.address && (
                              <p className="text-sm text-gray-500 truncate max-w-50">
                                {customer.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-gray-900">{customer.phone || '-'}</p>
                        {customer.email && (
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{completedSales.length}</span>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(totalSpent)}
                        </p>
                      </td>
                      <td>
                        {lastOrder ? (
                          <p className="text-sm text-gray-500">
                            {formatDateTime(lastOrder.date)}
                          </p>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Link>
                          <Link
                            href={`/dashboard/customers/${customer.id}/edit`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </Link>
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