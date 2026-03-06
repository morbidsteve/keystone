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
        className="p-8 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
      >
        No items added. Click inventory items above to add to manifest.
      </div>
    );
  }

  const totalItems = entries.reduce((acc, e) => acc + e.quantity, 0);
  const totalWeight = entries.reduce((acc, e) => acc + (e.weight_lbs ?? 0), 0);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Summary metrics row */}
      <div className="flex gap-6">
        <div>
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] text-[var(--color-text-muted)] uppercase mb-0.5"
          >
            TOTAL ITEMS
          </div>
          <div
            className="font-[var(--font-mono)] text-base font-bold text-[var(--color-text-bright)]"
          >
            {totalItems}
          </div>
        </div>
        <div>
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] text-[var(--color-text-muted)] uppercase mb-0.5"
          >
            TOTAL WEIGHT
          </div>
          <div
            className="font-[var(--font-mono)] text-base font-bold text-[var(--color-text-bright)]"
          >
            {totalWeight.toLocaleString()} lbs
          </div>
        </div>
        <div>
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] text-[var(--color-text-muted)] uppercase mb-0.5"
          >
            LINE ITEMS
          </div>
          <div
            className="font-[var(--font-mono)] text-base font-bold text-[var(--color-text-bright)]"
          >
            {entries.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={headerCellStyle}>ITEM</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>QTY</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>WEIGHT</th>
              <th style={headerCellStyle}>PRIORITY</th>
              <th style={headerCellStyle}>HANDLING</th>
              <th className="w-[60px]"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const pColor = PRIORITY_COLORS[entry.priority];
              return (
                <tr key={entry.item_id}>
                  <td
                    className="text-[var(--color-text-bright)] max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {entry.nomenclature}
                  </td>
                  <td className="font-semibold">
                    {entry.quantity}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    {entry.weight_lbs != null ? `${entry.weight_lbs.toLocaleString()} lbs` : '--'}
                  </td>
                  <td style={cellStyle}>
                    <span
                      className="inline-block py-0.5 px-1.5 rounded-[2px] font-[var(--font-mono)] text-[9px] font-bold tracking-[0.5px]" style={{ color: pColor.text, backgroundColor: pColor.bg, border: `1px solid ${pColor.border}` }}
                    >
                      {entry.priority}
                    </span>
                  </td>
                  <td
                    className="overflow-hidden text-ellipsis whitespace-nowrap text-[var(--color-text-muted)] text-[9px]"
                  >
                    {entry.special_handling ?? '--'}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => onEdit(entry)}
                        title="Edit"
                        className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] cursor-pointer"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={() => onRemove(entry.item_id)}
                        title="Remove"
                        className="flex items-center justify-center w-[22px] h-[22px] bg-transparent rounded-[var(--radius)] text-[#f87171] cursor-pointer border border-[rgba(248,113,113,0.4)]"
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
