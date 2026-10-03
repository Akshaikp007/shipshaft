'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

export default function InvoiceActionsClient() {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('Invoice download simulation started (PDF format).');
    }, 1000);
  };

  return (
    <div className="flex gap-3 w-full sm:w-auto">
      <button
        type="button"
        onClick={handlePrint}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface text-primary border border-outline-variant/40 hover:bg-surface-container transition-all font-label-md text-sm font-semibold shadow-sm"
      >
        <Icon name="print" size={18} />
        <span>Print Invoice</span>
      </button>
      <button
        type="button"
        disabled={downloading}
        onClick={handleDownload}
        className="flex-1 sm:flex-none btn-premium flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold shadow-md hover:bg-primary-container transition-all"
      >
        <Icon name="download" size={18} />
        <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
      </button>
    </div>
  );
}
