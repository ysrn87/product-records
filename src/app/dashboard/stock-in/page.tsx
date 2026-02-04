import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStockEntries } from '@/actions/stock';
import { formatDateTime, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { PackagePlus, Search, Eye } from 'lucide-react';
import StockEntryActions from './StockEntryActions';
import Pagination from '@/components/ui/Pagination';
import NewStockEntryButton from './NewStockEntryButton';

export default async function StockInPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'WAREHOUSE'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;

  const { entries, pagination } = await getStockEntries({
    search: params.search,
    status: params.status,
    page: currentPage,
  });

  const isWarehouse = session.user.role === 'WAREHOUSE';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock In</h1>
          <p className="text-gray-500 mt-1">Record incoming product stock</p>
        </div>
        <NewStockEntryButton isWarehouse={isWarehouse} />
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

      {/* Stock Entries Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Entry Number</th>
                <th>Items</th>
                <th>Total Qty</th>
                <th>Recorded By</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <PackagePlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No stock entries found</p>
                    <Link
                      href="/dashboard/stock-in/new"
                      className="text-primary-600 hover:underline mt-2 inline-block"
                    >
                      Record your first stock entry
                    </Link>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const totalQty = entry.items.reduce((sum, item) => sum + item.quantity, 0);
                  
                  return (
                    <tr key={entry.id}>
                      <td>
                        <p className="font-mono text-sm font-medium text-gray-900">
                          {entry.entryNumber}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-gray-500 truncate max-w-37.5">
                            {entry.notes}
                          </p>
                        )}
                      </td>
                      <td>
                        <p className="text-gray-900">{entry.items.length} items</p>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900">
                          {formatNumber(totalQty)} units
                        </p>
                      </td>
                      <td>
                        <p className="text-gray-900">{entry.recordedBy.name}</p>
                      </td>
                      <td>
                        {entry.status === 'COMPLETED' ? (
                          <span className="badge-success">Completed</span>
                        ) : (
                          <span className="badge-danger">Cancelled</span>
                        )}
                      </td>
                      <td>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(entry.date)}
                        </p>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/stock-in/${entry.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Link>
                          {entry.status === 'COMPLETED' && (
                            <StockEntryActions entry={entry} />
                          )}
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