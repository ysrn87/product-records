import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PackagePlus,
} from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@prisma/client';

async function getDashboardStats(userRole: string, userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // PARALLELIZED: Run independent queries simultaneously
  const [totalProducts, totalVariants, lowStockItems] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { isActive: true } }),
    prisma.productVariant.count({
      where: {
        isActive: true,
        currentStock: {
          lte: prisma.productVariant.fields.minStockLevel,
        },
      },
    }),
  ]);

  // Sales data (only for non-warehouse roles)
  let todaySales = { amount: 0, count: 0 };
  let thisMonthSales = { amount: 0, count: 0 };
  let lastMonthSales = 0;
  let recentSales: any[] = [];

  if (userRole !== 'WAREHOUSE') {
    // Sales filter for SALES role
    const salesFilter = userRole === 'SALES' ? { salespersonId: userId } : {};

    // Today's sales
    const [todaySalesData, thisMonthSalesData, lastMonthSalesData, recentSalesData] =
      await Promise.all([
        prisma.sale.aggregate({
          where: {
            status: 'COMPLETED',
            date: { gte: today },
            ...salesFilter,
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.sale.aggregate({
          where: {
            status: 'COMPLETED',
            date: { gte: startOfMonth },
            ...salesFilter,
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.sale.aggregate({
          where: {
            status: 'COMPLETED',
            date: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
            ...salesFilter,
          },
          _sum: { totalAmount: true },
        }),
        prisma.sale.findMany({
          where: {
            status: 'COMPLETED',
            ...salesFilter,
          },
          include: {
            customer: true,
            salesperson: true,
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 5,
        }),
      ]);


    todaySales = {
      amount: Number(todaySalesData._sum.totalAmount) || 0,
      count: todaySalesData._count,
    };
    thisMonthSales = {
      amount: Number(thisMonthSalesData._sum.totalAmount) || 0,
      count: thisMonthSalesData._count,
    };
    lastMonthSales = Number(lastMonthSalesData._sum.totalAmount) || 0;
    recentSales = recentSalesData
  }

  // Stock entries (for warehouse)
  let recentStockEntries: any[] = [];
  let todayStockEntries = { count: 0, units: 0 };
  let thisMonthStockEntries = { count: 0, units: 0 };

  if (userRole === 'WAREHOUSE' || userRole === 'PRIVILEGE' || userRole === 'ADMIN') {
    recentStockEntries = await prisma.stockEntry.findMany({
      where: { status: 'COMPLETED' },
      include: {
        recordedBy: true,
        items: true,
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const todayEntries = await prisma.stockEntry.findMany({
      where: {
        status: 'COMPLETED',
        date: { gte: today },
      },
      include: { items: true },
    });

    const thisMonthEntries = await prisma.stockEntry.findMany({
      where: {
        status: 'COMPLETED',
        date: { gte: startOfMonth },
      },
      include: { items: true },
    });

    todayStockEntries = {
      count: todayEntries.length,
      units: todayEntries.reduce((sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0), 0),
    };

    thisMonthStockEntries = {
      count: thisMonthEntries.length,
      units: thisMonthEntries.reduce((sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0), 0),
    };
  }

  // Low stock products
  const lowStockProducts = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      currentStock: {
        lte: prisma.productVariant.fields.minStockLevel,
      },
    },
    include: {
      product: true,
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
    take: 5,
  });

  return {
    totalProducts,
    totalVariants,
    lowStockItems,
    todaySales,
    thisMonthSales,
    lastMonthSales,
    recentSales,
    lowStockProducts,
    recentStockEntries,
    todayStockEntries,
    thisMonthStockEntries,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userRole = session?.user?.role || 'SALES';
  const userId = session?.user?.id || '';
  const stats = await getDashboardStats(userRole, userId);
  const isWarehouse = userRole === 'WAREHOUSE';

  const salesGrowth = stats.lastMonthSales > 0
    ? ((stats.thisMonthSales.amount - stats.lastMonthSales) / stats.lastMonthSales) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-500 mt-1">
          {isWarehouse
            ? "Here's your warehouse overview for today."
            : "Here's what's happening with your store today."
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales / Stock Entries */}
        {isWarehouse ? (
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">Today's Stock Entries</p>
                <p className="stat-value">{formatNumber(stats.todayStockEntries.count)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatNumber(stats.todayStockEntries.units)} units received
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <PackagePlus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        ) : (
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{userRole === 'SALES' ? "My Today's Sales" : "Today's Sales"}</p>
                <p className="stat-value">{formatCurrency(stats.todaySales.amount)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.todaySales.count} transactions
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Monthly Sales / Stock Entries */}
        {isWarehouse ? (
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">This Month's Entries</p>
                <p className="stat-value">{formatNumber(stats.thisMonthStockEntries.count)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatNumber(stats.thisMonthStockEntries.units)} units received
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        ) : (
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{userRole === 'SALES' ? 'My This Month' : 'This Month'}</p>
                <p className="stat-value">{formatCurrency(stats.thisMonthSales.amount)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {salesGrowth >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span className={salesGrowth >= 0 ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                    {Math.abs(salesGrowth).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Total Products */}
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total Products</p>
              <p className="stat-value">{formatNumber(stats.totalProducts)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatNumber(stats.totalVariants)} variants
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Low Stock Alert</p>
              <p className="stat-value text-warning-600">{formatNumber(stats.lowStockItems)}</p>
              <p className="text-sm text-gray-500 mt-1">items need restock</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales / Stock Entries */}
        {isWarehouse ? (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Stock Entries</h2>
              <Link href="/dashboard/stock-in" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="card-body p-0">
              {stats.recentStockEntries.length === 0 ? (
                <p className="p-6 text-center text-gray-500">No stock entries yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stats.recentStockEntries.map((entry: any) => {
                    const totalUnits = entry.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                    return (
                      <div key={entry.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{entry.entryNumber}</p>
                            <p className="text-sm text-gray-500">
                              {entry.items.length} items • {totalUnits} units
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {entry.recordedBy.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(entry.entryDate).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {userRole === 'SALES' ? 'My Recent Sales' : 'Recent Sales'}
              </h2>
              <Link href="/dashboard/sales" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="card-body p-0">
              {stats.recentSales.length === 0 ? (
                <p className="p-6 text-center text-gray-500">No sales yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stats.recentSales.map((sale: any) => (
                    <div key={sale.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{sale.customer.name}</p>
                          <p className="text-sm text-gray-500">
                            {sale.invoiceNumber} • {sale.items.length} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(Number(sale.totalAmount))}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Low Stock Items */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Low Stock Items</h2>
            <Link href="/dashboard/stock-levels" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="card-body p-0">
            {stats.lowStockProducts.length === 0 ? (
              <p className="p-6 text-center text-gray-500">All items are well stocked</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.lowStockProducts.map((variant: any) => {
                  const variantName = variant.variantValues
                    .map((vv: any) => vv.variantOption.value)
                    .join(' - ');

                  return (
                    <div key={variant.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{variant.product.name}</p>
                          <p className="text-sm text-gray-500">{variantName}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${variant.currentStock <= 0 ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                            {variant.currentStock} left
                          </p>
                          <p className="text-xs text-gray-500">
                            Min: {variant.minStockLevel}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}