// =============================================================================
// FuelTransactionTable — Transaction history table with type badges
// =============================================================================

import { Fuel } from 'lucide-react';
import type { FuelTransaction } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';

interface FuelTransactionTableProps {
  transactions: FuelTransaction[];
}

const typeBadgeStyles: Record<string, { bg: string; color: string }> = {
  RECEIPT: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
  ISSUE: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  TRANSFER: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  LOSS: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  SAMPLE: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatQuantity(type: string, qty: number): string {
  if (type === 'RECEIPT') return `+${qty.toLocaleString()}`;
  if (type === 'ISSUE' || type === 'LOSS' || type === 'TRANSFER')
    return `-${qty.toLocaleString()}`;
  return qty.toLocaleString();
}

const headerStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  padding: '8px 10px',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
};

const cellStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text)',
  padding: '8px 10px',
  borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
};

export default function FuelTransactionTable({ transactions }: FuelTransactionTableProps) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<Fuel size={32} />}
        title="NO TRANSACTIONS"
        message="Fuel transactions will appear here"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th style={headerStyle}>Date</th>
            <th style={headerStyle}>Type</th>
            <th style={headerStyle}>Fuel</th>
            <th style={{ ...headerStyle, textAlign: 'right' }}>Quantity</th>
            <th style={headerStyle}>Storage Point</th>
            <th style={headerStyle}>Vehicle</th>
            <th style={headerStyle}>Document #</th>
            <th style={headerStyle}>Performed By</th>
            <th style={headerStyle}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((txn) => {
            const badge = typeBadgeStyles[txn.transaction_type] ?? typeBadgeStyles.SAMPLE;
            return (
              <tr
                key={txn.id}
                style={{
                  transition: 'background-color var(--transition)',
                }}
              >
                <td style={cellStyle}>{formatDate(txn.transaction_date)}</td>
                <td style={cellStyle}>
                  <span
                    className="font-[var(--font-mono)] text-[9px] font-semibold py-0.5 px-2 rounded-[3px] tracking-[0.5px]" style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {txn.transaction_type}
                  </span>
                </td>
                <td style={cellStyle}>{txn.fuel_type}</td>
                <td
                  className="font-semibold" style={{ color: txn.transaction_type === 'RECEIPT'
                        ? '#22c55e'
                        : txn.transaction_type === 'LOSS'
                          ? '#ef4444'
                          : 'var(--color-text)' }}
                >
                  {formatQuantity(txn.transaction_type, txn.quantity_gallons)} gal
                </td>
                <td style={cellStyle}>{txn.storage_point_name ?? `SP-${txn.storage_point_id}`}</td>
                <td style={cellStyle}>
                  {txn.vehicle_bumper_number
                    ? `${txn.vehicle_bumper_number}${txn.vehicle_type ? ` (${txn.vehicle_type})` : ''}`
                    : txn.vehicle_type ?? '—'}
                </td>
                <td className="text-[var(--color-text-muted)]">
                  {txn.document_number ?? '—'}
                </td>
                <td style={cellStyle}>{txn.performed_by_name ?? '—'}</td>
                <td
                  className="text-[var(--color-text-muted)] max-w-[200px] overflow-hidden text-ellipsis"
                  title={txn.notes ?? ''}
                >
                  {txn.notes ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
