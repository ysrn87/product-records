'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// global-error replaces the root layout when it renders,
// so it must include <html> and <body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4 bg-gray-50">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Application error</h2>
            <p className="text-sm text-gray-500 max-w-sm">
              A critical error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
            )}
          </div>

          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
