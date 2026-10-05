'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

export default function InvoiceActionsClient({ invoice }) {
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const invoiceNumber = invoice?.invoiceNumber;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownload = async () => {
    if (!invoiceNumber) {
      setErrorMessage('Invoice identifier is missing.');
      return;
    }

    setDownloading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/invoices/${encodeURIComponent(invoiceNumber)}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        let errorText = 'Failed to download invoice PDF.';
        try {
          const data = await response.json();
          if (data?.error) {
            errorText = data.error;
          }
        } catch {
          // If response is not JSON, use default errorText
        }
        throw new Error(errorText);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ShipShaft-Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('[InvoiceActionsClient] Download error:', err);
      setErrorMessage(err.message || 'Unable to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
      <div className="flex gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface text-primary border border-outline-variant/40 hover:bg-surface-container transition-all font-label-md text-sm font-semibold shadow-sm cursor-pointer"
        >
          <Icon name="print" size={18} />
          <span>Print Invoice</span>
        </button>
        <button
          type="button"
          disabled={downloading}
          onClick={handleDownload}
          aria-label="Download Official Invoice PDF"
          className="flex-1 sm:flex-none btn-premium flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold shadow-md hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Icon
            name={downloading ? 'progress_activity' : 'download'}
            size={18}
            className={downloading ? 'animate-spin' : ''}
          />
          <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-error font-medium bg-error/10 px-3 py-1 rounded-lg border border-error/20">
          <Icon name="error" size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
