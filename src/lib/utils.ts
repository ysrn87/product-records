import { type ClassValue, clsx } from 'clsx';

// Class name merger
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format currency (Indonesian Rupiah)
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Format number with thousand separator
export function formatNumber(num: number | string | null | undefined): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n === null || n === undefined || isNaN(n)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(n);
}

// Format date
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

// Format datetime
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Generate invoice number
export function generateInvoiceNumber(prefix: string, counter: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const num = counter.toString().padStart(4, '0');
  return `${prefix}-${year}${month}${day}-${num}`;
}

// Generate stock entry number
export function generateStockEntryNumber(prefix: string, counter: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const num = counter.toString().padStart(4, '0');
  return `${prefix}-${year}${month}${day}-${num}`;
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Parse decimal safely
export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

// Role display names
export const roleDisplayNames: Record<string, string> = {
  PRIVILEGE: 'Super Admin',
  ADMIN: 'Admin',
  SALES: 'Sales',
  WAREHOUSE: 'Warehouse',
};

// Status badge colors
export const statusColors: Record<string, string> = {
  ACTIVE: 'badge-success',
  INACTIVE: 'badge-gray',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  VOIDED: 'badge-warning',
};

// Payment method display names
export const paymentMethodNames: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  EWALLET: 'E-Wallet',
  OTHER: 'Other',
};

// Add this function at the end of the file
export function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'object' && value !== null && 'toNumber' in value
        ? Number(value)
        : value
    )
  );
}
