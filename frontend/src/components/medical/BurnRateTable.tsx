// =============================================================================
// BurnRateTable — Class VIII supply burn rate tracker
// =============================================================================

import { useState, useMemo } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import type { MedicalBurnRate } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dosColor(days: number | null): string {
  if (days === null) return '#6b7280';
  if (days < 3) return '#ef4444';
  if (days < 7) return '#f59e0b';
  return '#22c55e';
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = 'name' | 'onHand' | 'burnRate' | 'dos' | 'exhaustion';

interface BurnRateTableProps {
  burnRates: MedicalBurnRate[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BurnRateTable({ burnRates }: BurnRateTableProps) {
  const [sortField, setSortField] = useState<SortField>('dos');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...burnRates];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.supply_name.localeCompare(b.supply_name);
          break;
        case 'onHand':
          cmp = a.quantity_on_hand - b.quantity_on_hand;
          break;
        case 'burnRate':
          cmp = a.burn_rate_per_day - b.burn_rate_per_day;
          break;
        case 'dos':
          cmp = (a.days_of_supply ?? 9999) - (b.days_of_supply ?? 9999);
          break;
        case 'exhaustion': {
          const aDate = a.projected_exhaustion_date ? new Date(a.projected_exhaustion_date).getTime() : Infinity;
          const bDate = b.projected_exhaustion_date ? new Date(b.projected_exhaustion_date).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [burnRates, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    padding: '10px 12px',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  };

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortAsc ? ' \u25B2' : ' \u25BC') : '';

  if (burnRates.length === 0) {
    return (
      <EmptyState
        icon={<Activity size={32} />}
        title="NO BURN RATE DATA"
        message="Medical supply burn rate data will appear here"
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerStyle} onClick={() => handleSort('name')}>
              SUPPLY NAME{sortIndicator('name')}
            </th>
            <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('onHand')}>
              QTY ON HAND{sortIndicator('onHand')}
            </th>
            <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('burnRate')}>
              BURN RATE/DAY{sortIndicator('burnRate')}
            </th>
            <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('dos')}>
              DAYS OF SUPPLY{sortIndicator('dos')}
            </th>
            <th style={headerStyle} onClick={() => handleSort('exhaustion')}>
              PROJECTED EXHAUSTION{sortIndicator('exhaustion')}
            </th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((br) => {
            const color = dosColor(br.days_of_supply);
            const isCritical = br.days_of_supply !== null && br.days_of_supply < 3;

            return (
              <tr
                key={br.id}
                style={{ transition: 'background-color var(--transition)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>
                  {isCritical && (
                    <AlertTriangle
                      size={11}
                      style={{
                        verticalAlign: 'middle',
                        marginRight: 6,
                        color: '#ef4444',
                      }}
                    />
                  )}
                  {br.supply_name}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>
                  {br.quantity_on_hand}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {br.burn_rate_per_day.toFixed(2)}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontWeight: 700,
                    color,
                  }}
                >
                  {br.days_of_supply !== null ? br.days_of_supply : '--'}
                </td>
                <td style={{ ...cellStyle, color: 'var(--color-text-muted)', fontSize: 10 }}>
                  {formatDate(br.projected_exhaustion_date)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 2,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '1px',
                      color,
                      backgroundColor: `${color}18`,
                      border: `1px solid ${color}40`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {br.days_of_supply === null
                      ? 'UNKNOWN'
                      : br.days_of_supply < 3
                        ? 'CRITICAL'
                        : br.days_of_supply < 7
                          ? 'LOW'
                          : 'ADEQUATE'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
