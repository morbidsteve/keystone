// =============================================================================
// TablePagination — Reusable pagination controls for data tables
// =============================================================================

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

/**
 * Generate page numbers with ellipsis for large page counts.
 * Returns an array of page numbers and -1 for ellipsis markers.
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | -1)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | -1)[] = [];

  // Always show first page
  pages.push(1);

  if (currentPage > 3) {
    pages.push(-1); // ellipsis
  }

  // Show pages around current
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push(-1); // ellipsis
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export default function TablePagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const btnBase =
    'font-[var(--font-mono)] text-[10px] tracking-[0.5px] py-1 px-2 border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-150';
  const btnDisabled =
    'opacity-30 cursor-not-allowed pointer-events-none';
  const btnActive =
    'bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)] font-semibold';

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 py-3 px-1">
      {/* Left: item range */}
      <div className="font-[var(--font-mono)] text-[10px] tracking-[1px] text-[var(--color-text-muted)] uppercase whitespace-nowrap">
        SHOWING {startItem}–{endItem} OF {totalItems} ITEMS
      </div>

      {/* Center: page buttons */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={`${btnBase} inline-flex items-center gap-0.5 ${isFirstPage ? btnDisabled : 'hover:bg-[var(--color-bg-hover)]'}`}
          aria-label="Previous page"
        >
          <ChevronLeft size={12} />
          <span className="hidden sm:inline">PREV</span>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, idx) =>
          page === -1 ? (
            <span
              key={`ellipsis-${idx}`}
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] px-1"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`${btnBase} min-w-[28px] text-center ${
                page === currentPage ? btnActive : 'hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={`${btnBase} inline-flex items-center gap-0.5 ${isLastPage ? btnDisabled : 'hover:bg-[var(--color-bg-hover)]'}`}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">NEXT</span>
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Right: page size selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
            PER PAGE
          </label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="py-1 px-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px]"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
