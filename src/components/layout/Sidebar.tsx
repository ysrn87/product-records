'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types & Constants
// =============================================================================

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

const AUTO_COLLAPSE_BREAKPOINT = 1024; // lg breakpoint
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['PRIVILEGE', 'ADMIN', 'SALES', 'WAREHOUSE'] },
  { label: 'Products', href: '/dashboard/products', icon: Package, roles: ['PRIVILEGE', 'ADMIN'] },
  { label: 'Stock In', href: '/dashboard/stock-in', icon: PackagePlus, roles: ['PRIVILEGE', 'ADMIN', 'WAREHOUSE'] },
  { label: 'Sales', href: '/dashboard/sales', icon: ShoppingCart, roles: ['PRIVILEGE', 'ADMIN', 'SALES'] },
  { label: 'Customers', href: '/dashboard/customers', icon: Users, roles: ['PRIVILEGE', 'ADMIN', 'SALES'] },
  { label: 'Stock Levels', href: '/dashboard/stock-levels', icon: Boxes, roles: ['PRIVILEGE', 'ADMIN', 'WAREHOUSE'] },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['PRIVILEGE'] },
  { label: 'User Management', href: '/dashboard/users', icon: UserCog, roles: ['PRIVILEGE', 'ADMIN'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['PRIVILEGE', 'ADMIN'] },
];

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  PRIVILEGE: 'Super Admin',
  ADMIN: 'Admin',
  SALES: 'Sales',
  WAREHOUSE: 'Warehouse',
};

// =============================================================================
// Helper Functions
// =============================================================================

const getStoredCollapsedState = (): boolean | null => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
  return saved !== null ? JSON.parse(saved) : null;
};

const setStoredCollapsedState = (collapsed: boolean): void => {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
};

const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// =============================================================================
// Component
// =============================================================================

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Filter nav items based on user role
  const filteredNavItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  const userInitials = getUserInitials(userName);

  // Handle responsive behavior
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < AUTO_COLLAPSE_BREAKPOINT;
    setIsMobile(mobile);

    if (mobile) {
      setIsCollapsed(true);
    } else {
      const savedState = getStoredCollapsedState();
      setIsCollapsed(savedState ?? false);
    }
  }, []);

  // Initialize and listen for resize
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Toggle collapsed state
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (!isMobile) {
      setStoredCollapsedState(newState);
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Check if nav item is active
  const isNavItemActive = (href: string): boolean => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };

  return (
    <aside
      className={cn(
        'sticky top-0 left-0 z-40 h-screen bg-white border-r border-gray-200',
        'flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        'h-16 border-b border-gray-200 shrink-0 flex items-center',
        isCollapsed ? 'px-3 justify-center' : 'px-4'
      )}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            <h1 className="font-bold text-gray-900 whitespace-nowrap">Stock Manager</h1>
            <p className="text-xs text-gray-500">v1.0.0</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center h-11 rounded-lg transition-colors duration-200',
                    'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    isActive && 'bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-700',
                    isCollapsed ? 'justify-center px-0' : 'px-3'
                  )}
                >
                  <span className={cn('flex items-center justify-center', isCollapsed ? 'w-full' : 'w-8')}>
                    <Icon className="w-5 h-5 shrink-0" />
                  </span>
                  <span className={cn(
                    'flex-1 whitespace-nowrap overflow-hidden transition-all duration-300',
                    isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-1'
                  )}>
                    {item.label}
                  </span>
                  {!isCollapsed && isActive && (
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 shrink-0 p-3 space-y-2">
        {/* User Info */}
        <div className={cn(
          'bg-gray-50 rounded-lg transition-all duration-300',
          isCollapsed ? 'p-2' : 'p-3'
        )}>
          {isCollapsed ? (
            <div 
              className="w-10 h-10 mx-auto bg-primary-100 rounded-full flex items-center justify-center"
              title={`${userName} (${ROLE_DISPLAY_NAMES[userRole]})`}
            >
              <span className="text-sm font-semibold text-primary-600">{userInitials}</span>
            </div>
          ) : (
            <>
              <p className="font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-sm text-gray-500">{ROLE_DISPLAY_NAMES[userRole]}</p>
            </>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          title={isCollapsed ? 'Sign Out' : undefined}
          className={cn(
            'w-full flex items-center h-11 rounded-lg transition-colors duration-200',
            'text-gray-600 hover:bg-red-50 hover:text-red-600',
            isCollapsed ? 'justify-center px-0' : 'px-3'
          )}
        >
          <span className={cn('flex items-center justify-center', isCollapsed ? 'w-full' : 'w-8')}>
            <LogOut className="w-5 h-5 shrink-0" />
          </span>
          <span className={cn(
            'whitespace-nowrap overflow-hidden transition-all duration-300',
            isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-1'
          )}>
            Sign Out
          </span>
        </button>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 -right-3',
          'w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm',
          'flex items-center justify-center',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500',
          'transition-colors duration-200'
        )}
      >
        <ChevronLeft className={cn(
          'w-4 h-4 text-gray-600 transition-transform duration-300',
          isCollapsed && 'rotate-180'
        )} />
      </button>
    </aside>
  );
}