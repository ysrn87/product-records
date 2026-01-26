'use client';

import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrintButton() {
  const router = useRouter();

  return (
    <>
      {/* Desktop buttons */}
      <div className="hidden sm:flex items-center gap-2 no-print">
        <button
          onClick={() => router.back()}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="btn-primary"
        >
          <Printer className="w-4 h-4" />
          Print Invoice
        </button>
      </div>

      {/* Mobile fixed bottom buttons */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 flex gap-2 no-print">
        <button
          onClick={() => router.back()}
          className="flex-1 btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 btn-primary"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Mobile bottom spacer to prevent content from being hidden */}
      <div className="sm:hidden h-20 no-print" />
    </>
  );
}