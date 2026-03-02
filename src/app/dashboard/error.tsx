'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error tracking service here (e.g. Sentry)
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          An unexpected error occurred. You can try again, or return to the dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </a>
      </div>
    </div>
  );
}
