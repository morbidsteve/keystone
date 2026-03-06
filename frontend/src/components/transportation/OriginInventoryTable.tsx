// =============================================================================
// OriginInventoryTable — Searchable, paginated inventory table for manifest building
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import type { LocationInventoryItem } from '@/lib/types';
import { getLocationInventory } from '@/api/transportation';

interface OriginInventoryTableProps {
  location: string;
  onItemClick: (item: LocationInventoryItem) => void;
}

const PAGE_SIZE = 10;

const CATEGORIES = ['ALL', 'VEHICLES', 'WEAPONS', 'COMMS', 'SUPPLY', 'AMMO', 'EQUIPMENT'] as const;

const cellStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase' as const,
  backgroundColor: 'var(--color-bg-elevated)',
};

export default function OriginInventoryTable({ location, onItemClick }: OriginInventoryTableProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<LocationInventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Reset page when category changes
  useEffect(() => {
    setPage(0);
  }, [category]);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLocationInventory(location, {
      q: debouncedSearch || undefined,
      category: category !== 'ALL' ? category : undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })
      .then((result) => {
        if (!cancelled) {
          setItems(result.data);
          setTotalCount(result.total_count);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location, debouncedSearch, category, page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showingStart = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search by nomenclature, TAMCN, or NSN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full py-2 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
      />

      {/* Category filter buttons */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="py-1 px-2.5 font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] rounded-[var(--radius)] cursor-pointer uppercase" style={{ border: '1px solid', borderColor: category === cat ? 'var(--color-accent)' : 'var(--color-border)', backgroundColor: category === cat ? 'rgba(77, 171, 247, 0.15)' : 'transparent', color: category === cat ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div
          className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
        >
          Loading inventory...
        </div>
      ) : items.length === 0 ? (
        <div
          className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
        >
          No items found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={headerCellStyle}>ITEM</th>
                <th style={headerCellStyle}>TAMCN/NSN</th>
                <th style={headerCellStyle}>CATEGORY</th>
                <th style={{ ...headerCellStyle, textAlign: 'right' }}>QTY</th>
                <th style={headerCellStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.item_id}
                  onClick={() => onItemClick(item)}
                  className="cursor-pointer"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      'rgba(77, 171, 247, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '';
                  }}
                >
                  <td className="text-[var(--color-text-bright)]">
                    {item.nomenclature}
                  </td>
                  <td style={cellStyle}>{item.tamcn ?? item.nsn ?? '--'}</td>
                  <td style={cellStyle}>{item.category}</td>
                  <td className="font-semibold">
                    {item.available_qty}
                  </td>
                  <td style={cellStyle}>
                    <span
                      className="inline-block py-0.5 px-1.5 rounded-[2px] font-[var(--font-mono)] text-[9px] font-semibold text-[#4ade80] bg-[rgba(74,222,128,0.15)] border border-[rgba(74,222,128,0.4)]"
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <div
          className="flex justify-between items-center pt-1"
        >
          <span
            className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
          >
            Showing {showingStart}-{showingEnd} of {totalCount}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="py-1 px-2.5 font-[var(--font-mono)] text-[9px] font-semibold border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent" style={{ color: page === 0 ? 'var(--color-text-muted)' : 'var(--color-text)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}
            >
              PREVIOUS
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="py-1 px-2.5 font-[var(--font-mono)] text-[9px] font-semibold border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent" style={{ color: page >= totalPages - 1 ? 'var(--color-text-muted)' : 'var(--color-text)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1 }}
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
