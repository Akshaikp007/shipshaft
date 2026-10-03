'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

/**
 * Reusable production-ready DataTable component with search, column sorting, pagination, and empty state.
 */
export default function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Search records...',
  filterComponent,
  pageSize = 8,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) => {
        if (typeof val === 'string') return val.toLowerCase().includes(term);
        if (typeof val === 'number') return String(val).includes(term);
        if (typeof val === 'object' && val !== null) {
          return Object.values(val).some(
            (nested) => typeof nested === 'string' && nested.toLowerCase().includes(term)
          );
        }
        return false;
      })
    );
  }, [data, searchTerm]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div
      className={`glass-panel border border-outline-variant/30 rounded-2xl bg-white/95 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Table Toolbar */}
      {(searchable || filterComponent) && (
        <div className="p-4 border-b border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-low/30">
          {searchable && (
            <div className="relative w-full sm:w-72">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline flex items-center pointer-events-none">
                <Icon name="search" size={18} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2 pl-9 pr-3 text-xs font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          )}

          {filterComponent && <div className="w-full sm:w-auto flex items-center gap-2">{filterComponent}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        {sortedData.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={searchTerm ? 'Clear Search' : undefined}
            onAction={() => setSearchTerm('')}
          />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 text-xs font-label-md text-on-surface-variant uppercase tracking-wider">
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    onClick={() => col.sortable && col.key && handleSort(col.key)}
                    className={`py-3.5 px-4 font-semibold select-none ${
                      col.sortable ? 'cursor-pointer hover:text-primary transition-colors' : ''
                    } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && sortField === col.key && (
                        <Icon
                          name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          size={14}
                          className="text-primary"
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-xs font-body-md text-on-surface">
              {paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-surface-container-lowest/80 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key || col.header}
                      className={`py-3.5 px-4 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {sortedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
