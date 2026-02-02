import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import PeriodSelect from './PeriodSelect';
import { serializeData } from '@/lib/utils';

async function getReportsData(period: string = 'month') {
  const now = new Date();
  let startDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      prevEndDate = new Date(startDate);
      prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      break;
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  // Current period sales
  const currentSales = await prisma.sale.aggregate({
    where: {
      status: 'COMPLETED',
      date: { gte: startDate },
    },
    _sum: { totalAmount: true, discountAmount: true },
    _count: true,
  });

  // Previous period sales
  const prevSales = await prisma.sale.aggregate({
    where: {
      status: 'COMPLETED',
      date: { gte: prevStartDate, lte: prevEndDate },
    },
    _sum: { totalAmount: true },
  });

  // Profit calculation
  const salesItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        status: 'COMPLETED',
        date: { gte: startDate },
      },
    },
    include: {
      variant: true,
    },
  });

  const profit = salesItems.reduce((sum: any, item: any) => {
    const revenue = Number(item.totalPrice);
    const cost = Number(item.variant.costPrice) * item.quantity;
    return sum + (revenue - cost);
  }, 0);

  // Top selling products
  const topProducts = await prisma.saleItem.groupBy({
    by: ['variantId'],
    where: {
      sale: {
        status: 'COMPLETED',
        date: { gte: startDate },
      },
    },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

const variantIds = topProducts.map(p => p.variantId);
const variants = await prisma.productVariant.findMany({
  where: { id: { in: variantIds } },
  include: {
    product: true,
    variantValues: {
      include: {
        variantOption: { include: { variantType: true } },
      },
    },
  },
});

const variantMap = new Map(variants.map(v => [v.id, v]));
const topProductsWithDetails = topProducts.map(item => ({
  ...item,
  variant: variantMap.get(item.variantId),
}));

  // Top customers
  const topCustomers = await prisma.sale.groupBy({
    by: ['customerId'],
    where: {
      status: 'COMPLETED',
      date: { gte: startDate },
    },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 5,
  });

  const topCustomersWithDetails = await Promise.all(
    topCustomers.map(async (item: any) => {
      const customer = serializeData(await prisma.customer.findUnique({
        where: { id: item.customerId },
      }));
      return {
        ...item,
        customer,
      };
    })
  );

  // Sales by payment method
  const salesByPayment = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where: {
      status: 'COMPLETED',
      date: { gte: startDate },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  // Daily sales for chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const dailySales = await Promise.all(
    last7Days.map(async (date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const sales = serializeData(await prisma.sale.aggregate({
        where: {
          status: 'COMPLETED',
          date: { gte: date, lt: nextDate },
        },
        _sum: { totalAmount: true },
        _count: true,
      }));

      return {
        date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        amount: Number(sales._sum.totalAmount) || 0,
        count: sales._count,
      };
    })
  );

  return {
    currentPeriod: {
      revenue: Number(currentSales._sum.totalAmount) || 0,
      transactions: currentSales._count,
      discounts: Number(currentSales._sum.discountAmount) || 0,
      profit,
    },
    previousPeriod: {
      revenue: Number(prevSales._sum.totalAmount) || 0,
    },
    topProducts: topProductsWithDetails,
    topCustomers: topCustomersWithDetails,
    salesByPayment,
    dailySales,
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'PRIVILEGE') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const period = params.period || 'month';
  const data = await getReportsData(period);

  const revenueGrowth = data.previousPeriod.revenue > 0
    ? ((data.currentPeriod.revenue - data.previousPeriod.revenue) / data.previousPeriod.revenue) * 100
    : 0;

  const profitMargin = data.currentPeriod.revenue > 0
    ? (data.currentPeriod.profit / data.currentPeriod.revenue) * 100
    : 0;

  const paymentMethodNames: Record<string, string> = {
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    CREDIT_CARD: 'Credit Card',
    DEBIT_CARD: 'Debit Card',
    EWALLET: 'E-Wallet',
    OTHER: 'Other',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Track business performance and trends</p>
        </div>
        <PeriodSelect currentPeriod={period} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Revenue</p>
              <p className="stat-value">{formatCurrency(data.currentPeriod.revenue)}</p>
              <div className="flex items-center gap-1 mt-1">
                {revenueGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={revenueGrowth >= 0 ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                  {Math.abs(revenueGrowth).toFixed(1)}% vs previous
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Profit */}
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Profit</p>
              <p className="stat-value">{formatCurrency(data.currentPeriod.profit)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {profitMargin.toFixed(1)}% margin
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Transactions</p>
              <p className="stat-value">{formatNumber(data.currentPeriod.transactions)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(data.currentPeriod.revenue / (data.currentPeriod.transactions || 1))} avg
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Discounts */}
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Discounts Given</p>
              <p className="stat-value text-orange-600">{formatCurrency(data.currentPeriod.discounts)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {((data.currentPeriod.discounts / (data.currentPeriod.revenue + data.currentPeriod.discounts)) * 100 || 0).toFixed(1)}% of sales
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Daily Sales (Last 7 Days)</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {data.dailySales.map((day, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-12 text-sm text-gray-500">{day.date}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-primary-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(5, (day.amount / Math.max(...data.dailySales.map(d => d.amount), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-28 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(day.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales by Payment Method */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Sales by Payment Method</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {data.salesByPayment.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No sales data</p>
              ) : (
                data.salesByPayment.map((item: any) => (
                  <div key={item.paymentMethod} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary-500" />
                      <span className="text-gray-900">{paymentMethodNames[item.paymentMethod]}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item._sum.totalAmount)}</p>
                      <p className="text-xs text-gray-500">{item._count} transactions</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Top Selling Products</h2>
            <Link href="/dashboard/products" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="card-body p-0">
            {data.topProducts.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No sales data</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.topProducts.map((item, i) => {
                  const variantName = item.variant?.variantValues
                    .map((vv: any) => vv.variantOption.value)
                    .join(' - ') || '';
                  
                  return (
                    <div key={item.variantId} className="p-4 flex items-center gap-4">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.variant?.product.name}</p>
                        <p className="text-sm text-gray-500">{variantName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatNumber(item._sum.quantity || 0)} sold</p>
                        <p className="text-sm text-gray-500">{formatCurrency(Number(item._sum.totalPrice) || 0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Top Customers</h2>
            <Link href="/dashboard/customers" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="card-body p-0">
            {data.topCustomers.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No sales data</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.topCustomers.map((item, i) => (
                  <div key={item.customerId} className="p-4 flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.customer?.name}</p>
                      <p className="text-sm text-gray-500">{item.customer?.phone || 'No phone'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item._sum.totalAmount)}</p>
                      <p className="text-sm text-gray-500">{item._count} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
