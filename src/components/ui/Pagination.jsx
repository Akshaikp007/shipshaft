import React from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable Pagination component with page jump buttons, total item counter, and responsive controls.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1 && !totalItems) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-outline-variant/20 font-label-md text-xs text-on-surface-variant ${className}`}
    >
      <div>
        {totalItems ? (
          <span>
            Showing <strong className="text-on-surface font-semibold">{startItem}</strong> to{' '}
            <strong className="text-on-surface font-semibold">{endItem}</strong> of{' '}
            <strong className="text-on-surface font-semibold">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="text-on-surface">{currentPage}</strong> of{' '}
            <strong className="text-on-surface">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <Icon name="chevron_left" size={16} />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={`w-8 h-8 rounded-lg font-semibold text-xs flex items-center justify-center transition-all ${
              page === currentPage
                ? 'bg-primary text-on-primary shadow-sm'
                : 'border border-outline-variant/30 hover:bg-surface-container text-on-surface'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <Icon name="chevron_right" size={16} />
        </button>
      </div>
    </div>
  );
}
