// =============================================================================
// SensitiveItemsTable — Table of sensitive items with status/type badges
// =============================================================================

import { Shield } from 'lucide-react';
import type { SensitiveItem } from '@/lib/types';

interface SensitiveItemsTableProps {
  items: SensitiveItem[];
  onSelectItem: (id: number) => void;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  ON_HAND: '#22c55e',
  ISSUED: '#3b82f6',
  IN_TRANSIT: '#a855f7',
  IN_MAINTENANCE: '#f59e0b',
  MISSING: '#ef4444',
  LOST: '#ef4444',
  DESTROYED: '#6b7280',
  TRANSFERRED: '#8b5cf6',
};

const TYPE_COLORS: Record<string, string> = {
  WEAPON: '#ef4444',
  OPTIC: '#3b82f6',
  NVG: '#22c55e',
  CRYPTO: '#a855f7',
  RADIO: '#f59e0b',
  COMSEC: '#dc2626',
  CLASSIFIED_DOCUMENT: '#dc2626',
  EXPLOSIVE: '#f97316',
  MISSILE: '#f97316',
  OTHER: '#6b7280',
};

const thStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  padding: '8px 10px',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border)',
};

const tdStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  padding: '8px 10px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

export default function SensitiveItemsTable({
  items,
  onSelectItem,
  loading,
}: SensitiveItemsTableProps) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div
          className="skeleton"
          style={{ width: 200, height: 16, margin: '0 auto 12px' }}
        />
        <div
          className="skeleton"
          style={{ width: 300, height: 12, margin: '0 auto' }}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      >
        <Shield size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
        <div>No sensitive items found</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Serial #', 'Nomenclature', 'Type', 'Status', 'Condition', 'Holder', 'Last Inventory'].map(
              (h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const statusColor = STATUS_COLORS[item.status] ?? '#6b7280';
            const typeColor = TYPE_COLORS[item.item_type] ?? '#6b7280';

            return (
              <tr
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '';
                }}
              >
                <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>
                  {item.serial_number}
                </td>
                <td style={tdStyle}>{item.nomenclature}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 3,
                      backgroundColor: `${typeColor}20`,
                      color: typeColor,
                      fontWeight: 600,
                      fontSize: 9,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {item.item_type}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 3,
                      backgroundColor: `${statusColor}20`,
                      color: statusColor,
                      fontWeight: 600,
                      fontSize: 9,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>
                  {item.condition_code}
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>
                  {item.current_holder_name ?? '—'}
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>
                  {item.last_inventory_date
                    ? new Date(item.last_inventory_date).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
