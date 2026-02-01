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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

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

  // Get user initials for collapsed view
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'border-b border-gray-200 shrink-0 flex items-center',
          isCollapsed ? 'p-4 justify-center' : 'p-6'
        )}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className={cn(
              'bg-primary-600 rounded-xl flex items-center justify-center shrink-0',
              isCollapsed ? 'w-12 h-12' : 'w-10 h-10'
            )}>
              <Package className={cn(
                'text-white',
                isCollapsed ? 'w-7 h-7' : 'w-6 h-6'
              )} />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-gray-900 whitespace-nowrap">Stock Manager</h1>
                <p className="text-xs text-gray-500">v1.0.0</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
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
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
                      isActive && 'bg-primary-50 text-primary-600 hover:bg-primary-50 hover:text-primary-600',
                      isCollapsed && 'justify-center px-0'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn('shrink-0', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 whitespace-nowrap">{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 shrink-0 bg-white p-3">
          {/* User Info */}
          <div className={cn(
            'bg-gray-50 rounded-lg mb-2',
            isCollapsed ? 'p-2 flex justify-center' : 'p-3'
          )}>
            {isCollapsed ? (
              <div 
                className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center"
                title={`${userName} (${roleDisplayName[userRole]})`}
              >
                <span className="text-sm font-semibold text-primary-600">{userInitials}</span>
              </div>
            ) : (
              <>
                <p className="font-medium text-gray-900 truncate">{userName}</p>
                <span className="text-sm text-gray-500">{roleDisplayName[userRole]}</span>
              </>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center gap-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors',
              isCollapsed ? 'justify-center px-0' : 'px-3'
            )}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className={cn('shrink-0', isCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full',
            'flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <span className="font-semibold text-gray-900">Menu</span>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Mobile Navigation */}
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
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
                      isActive && 'bg-primary-50 text-primary-600 hover:bg-primary-50 hover:text-primary-600'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile User Info & Logout */}
        <div className="border-t border-gray-200 shrink-0 bg-white p-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <p className="font-medium text-gray-900 truncate">{userName}</p>
            <span className="text-sm text-gray-500">{roleDisplayName[userRole]}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}