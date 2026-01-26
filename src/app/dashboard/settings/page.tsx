import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { Building2, FileText, ClipboardList, Shield } from 'lucide-react';
import Link from 'next/link';
import CompanyProfileForm from './CompanyProfileForm';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  // Get or create company profile
  let companyProfile = await prisma.companyProfile.findFirst();
  if (!companyProfile) {
    companyProfile = await prisma.companyProfile.create({
      data: {
        name: 'My Company',
        invoicePrefix: 'INV',
        stockEntryPrefix: 'SE',
      },
    });
  }

  // Get recent activity logs
  const recentLogs = await prisma.activityLog.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Get system stats
  const stats = {
    totalUsers: await prisma.user.count(),
    totalProducts: await prisma.product.count(),
    totalSales: await prisma.sale.count(),
    totalCustomers: await prisma.customer.count(),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage company profile and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Company Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Profile */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <Building2 className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Company Profile</h2>
            </div>
            <div className="card-body">
              <CompanyProfileForm profile={companyProfile} />
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Document Settings</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700">Invoice Number Format</p>
                  <p className="text-lg font-mono text-gray-900 mt-1">
                    {companyProfile.invoicePrefix}-YYYYMMDD-0001
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: {companyProfile.invoicePrefix}-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700">Stock Entry Format</p>
                  <p className="text-lg font-mono text-gray-900 mt-1">
                    {companyProfile.stockEntryPrefix}-YYYYMMDD-0001
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: {companyProfile.stockEntryPrefix}-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          {session.user.role === 'PRIVILEGE' && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-primary-600" />
                  <h2 className="font-semibold text-gray-900">Activity Logs</h2>
                </div>
                <span className="text-sm text-gray-500">Last 10 activities</span>
              </div>
              <div className="card-body p-0">
                {recentLogs.length === 0 ? (
                  <p className="p-6 text-center text-gray-500">No activity recorded yet</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentLogs.map((log: any) => (
                      <div key={log.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{log.user.name}</span>
                              {' '}
                              <span className="text-gray-600">
                                {log.action.toLowerCase().replace(/_/g, ' ')}
                              </span>
                              {' '}
                              <span className="text-gray-500">
                                {log.entityType.toLowerCase()}
                              </span>
                            </p>
                            {log.details && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                                {log.details}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Stats & Info */}
        <div className="space-y-6">
          {/* System Stats */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">System Overview</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold text-gray-900">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Products</span>
                <span className="font-semibold text-gray-900">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Sales</span>
                <span className="font-semibold text-gray-900">{stats.totalSales}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Customers</span>
                <span className="font-semibold text-gray-900">{stats.totalCustomers}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Quick Links</h2>
            </div>
            <div className="card-body space-y-2">
              <Link
                href="/dashboard/users"
                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
              </Link>
              <Link
                href="/dashboard/products"
                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Product Management</p>
                <p className="text-sm text-gray-500">Manage products and categories</p>
              </Link>
              <Link
                href="/dashboard/reports"
                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">View Reports</p>
                <p className="text-sm text-gray-500">Sales and analytics reports</p>
              </Link>
            </div>
          </div>

          {/* Version Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700">System Version</p>
            <p className="text-gray-900 mt-1">Product Stock Management v1.0.0</p>
            <p className="text-xs text-gray-500 mt-2">
              Built with Next.js 15, TypeScript, Prisma, Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
