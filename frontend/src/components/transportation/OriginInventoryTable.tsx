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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search by nomenclature, TAMCN, or NSN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      />

      {/* Category filter buttons */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.5px',
              border: '1px solid',
              borderColor: category === cat ? 'var(--color-accent)' : 'var(--color-border)',
              borderRadius: 'var(--radius)',
              backgroundColor: category === cat ? 'rgba(77, 171, 247, 0.15)' : 'transparent',
              color: category === cat ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          Loading inventory...
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          No items found
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      'rgba(77, 171, 247, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '';
                  }}
                >
                  <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>
                    {item.nomenclature}
                  </td>
                  <td style={cellStyle}>{item.tamcn ?? item.nsn ?? '--'}</td>
                  <td style={cellStyle}>{item.category}</td>
                  <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>
                    {item.available_qty}
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: 2,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        color: '#4ade80',
                        backgroundColor: 'rgba(74, 222, 128, 0.15)',
                        border: '1px solid rgba(74, 222, 128, 0.4)',
                      }}
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
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 4,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
            }}
          >
            Showing {showingStart}-{showingEnd} of {totalCount}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{
                padding: '4px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'transparent',
                color: page === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.5 : 1,
              }}
            >
              PREVIOUS
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '4px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'transparent',
                color: page >= totalPages - 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages - 1 ? 0.5 : 1,
              }}
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
