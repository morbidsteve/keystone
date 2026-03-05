// =============================================================================
// ManifestSummary — Displays the cargo manifest with edit/remove controls
// =============================================================================

import { X, Pencil } from 'lucide-react';
import type { ManifestEntry } from '@/lib/types';

interface ManifestSummaryProps {
  entries: ManifestEntry[];
  onEdit: (entry: ManifestEntry) => void;
  onRemove: (itemId: string) => void;
}

const PRIORITY_COLORS: Record<
  ManifestEntry['priority'],
  { bg: string; text: string; border: string }
> = {
  ROUTINE: {
    bg: 'rgba(148, 163, 184, 0.15)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.4)',
  },
  PRIORITY: {
    bg: 'rgba(250, 204, 21, 0.15)',
    text: '#facc15',
    border: 'rgba(250, 204, 21, 0.4)',
  },
  URGENT: {
    bg: 'rgba(251, 146, 60, 0.15)',
    text: '#fb923c',
    border: 'rgba(251, 146, 60, 0.4)',
  },
  FLASH: {
    bg: 'rgba(248, 113, 113, 0.15)',
    text: '#f87171',
    border: 'rgba(248, 113, 113, 0.4)',
  },
};

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

export default function ManifestSummary({ entries, onEdit, onRemove }: ManifestSummaryProps) {
  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No items added. Click inventory items above to add to manifest.
      </div>
    );
  }

  const totalItems = entries.reduce((acc, e) => acc + e.quantity, 0);
  const totalWeight = entries.reduce((acc, e) => acc + (e.weight_lbs ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Summary metrics row */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            TOTAL ITEMS
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}
          >
            {totalItems}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            TOTAL WEIGHT
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}
          >
            {totalWeight.toLocaleString()} lbs
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            LINE ITEMS
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}
          >
            {entries.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>ITEM</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>QTY</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>WEIGHT</th>
              <th style={headerCellStyle}>PRIORITY</th>
              <th style={headerCellStyle}>HANDLING</th>
              <th style={{ ...headerCellStyle, textAlign: 'center', width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const pColor = PRIORITY_COLORS[entry.priority];
              return (
                <tr key={entry.item_id}>
                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: 600,
                      color: 'var(--color-text-bright)',
                      maxWidth: 240,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.nomenclature}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>
                    {entry.quantity}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    {entry.weight_lbs != null ? `${entry.weight_lbs.toLocaleString()} lbs` : '--'}
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: 2,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: pColor.text,
                        backgroundColor: pColor.bg,
                        border: `1px solid ${pColor.border}`,
                      }}
                    >
                      {entry.priority}
                    </span>
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      maxWidth: 140,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--color-text-muted)',
                      fontSize: 9,
                    }}
                  >
                    {entry.special_handling ?? '--'}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button
                        onClick={() => onEdit(entry)}
                        title="Edit"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          background: 'none',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={() => onRemove(entry.item_id)}
                        title="Remove"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          background: 'none',
                          border: '1px solid rgba(248, 113, 113, 0.4)',
                          borderRadius: 'var(--radius)',
                          color: '#f87171',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
