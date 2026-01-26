'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Boxes,
  UserCog,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RootLayout from '@/app/layout';

interface SidebarProps {
  userRole: UserRole;
  userName: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['PRIVILEGE', 'ADMIN', 'SALES', 'WAREHOUSE'],
  },
  {
    label: 'Products',
    href: '/dashboard/products',
    icon: Package,
    roles: ['PRIVILEGE', 'ADMIN'],
  },
  {
    label: 'Stock In',
    href: '/dashboard/stock-in',
    icon: PackagePlus,
    roles: ['PRIVILEGE', 'ADMIN', 'WAREHOUSE'],
  },
  {
    label: 'Sales',
    href: '/dashboard/sales',
    icon: ShoppingCart,
    roles: ['PRIVILEGE', 'ADMIN', 'SALES'],
  },
  {
    label: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    roles: ['PRIVILEGE', 'ADMIN', 'SALES'],
  },
  {
    label: 'Stock Levels',
    href: '/dashboard/stock-levels',
    icon: Boxes,
    roles: ['PRIVILEGE', 'ADMIN', 'WAREHOUSE'],
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: ['PRIVILEGE'],
  },
  {
    label: 'User Management',
    href: '/dashboard/users',
    icon: UserCog,
    roles: ['PRIVILEGE', 'ADMIN'],
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['PRIVILEGE', 'ADMIN'],
  },
];

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const roleDisplayName: Record<UserRole, string> = {
    PRIVILEGE: 'Super Admin',
    ADMIN: 'Admin',
    SALES: 'Sales',
    WAREHOUSE: 'Warehouse',
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 h-14 flex items-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Stock Manager</span>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo - Desktop only */}
        <div className="hidden lg:block p-6 border-b border-gray-200 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Stock Manager</h1>
              <p className="text-xs text-gray-500">v1.0.0</p>
            </div>
          </Link>
        </div>

        {/* Mobile Header - Close button area */}
        <div className="lg:hidden h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <span className="font-semibold text-gray-900">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'nav-link',
                      isActive && 'active'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout - Fixed at bottom */}
        <nav className='flex-1 overflow-y-auto'>
          <div className="p-4 border-t border-gray-200 shrink-0 bg-white">
            <div className="bg-gray-50 rounded-xs p-4 mb-3">
              <p className="font-medium text-gray-900 truncate">{userName}</p>
              <span className="text-sm text-gray-500">{roleDisplayName[userRole]}</span>
            </div>
            <div className="bg-gray-200 p-4 mb-1 w-full flex items-center gap-5 text-gray-900 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-5 w-full h-fit">
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}